import { Request, Response, NextFunction } from "express";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import { sendSuccessResponse } from "../../../shared/helpers/response.helper";

export const getAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const reqAny = req as any;
  const isAdmin: boolean = Boolean(reqAny.isAdminRole);
  const allowedFellowshipIds: string[] = reqAny.rbac?.allowedFellowshipIds || [];

  // Build a reusable base filter for member queries
  const memberBaseWhere: any = { isActive: true };
  if (!isAdmin && allowedFellowshipIds.length > 0) {
    memberBaseWhere.councilFellowshipId = { in: allowedFellowshipIds };
  } else if (!isAdmin && allowedFellowshipIds.length === 0) {
    // No fellowship assignments => return empty analytics
    return sendSuccessResponse(res, {
      analytics: {
        totalMembers: 0,
        diasporaMembers: 0,
        activeFellowships: 0,
        registrationTimeline: [],
        regionalDistribution: [],
        categoryDistribution: [],
        topFellowships: [],
        financials: { expectedRevenue: 0, collectedRevenue: 0, inReviewRevenue: 0, pendingRevenue: 0 },
        compliance: { rate: 0, pendingReview: 0, statusDistribution: [] },
        engagement: { activeChurchUsers: 0, recentActivity: [] },
      },
    });
  }

  // ── 1. Demographics ──────────────────────────────────────────────────────
  const totalMembers = await prisma.member.count({ where: memberBaseWhere });
  const diasporaMembers = await prisma.member.count({ where: { ...memberBaseWhere, isInEthiopia: false } });

  // For admins count all active fellowships; for scoped users count their assigned ones
  const activeFellowships = isAdmin
    ? await prisma.councilFellowship.count({ where: { isActive: true } })
    : allowedFellowshipIds.length;

  // Registration Timeline (in-memory grouping by month)
  const members = await prisma.member.findMany({
    where: memberBaseWhere,
    select: { createdAt: true },
  });
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const timelineMap: Record<string, number> = {};
  members.forEach((m) => {
    const month = months[m.createdAt.getMonth()];
    timelineMap[month] = (timelineMap[month] || 0) + 1;
  });
  const registrationTimeline =
    Object.keys(timelineMap).length > 0
      ? Object.entries(timelineMap).map(([month, count]) => ({ month, count }))
      : [{ month: months[new Date().getMonth()], count: 0 }];

  // Regional Distribution
  const membersByRegion = await prisma.member.groupBy({
    by: ["regionId"],
    _count: { regionId: true },
    where: memberBaseWhere,
  });
  const regionIds = membersByRegion.map((m) => m.regionId).filter(Boolean) as string[];
  const regions = await prisma.dataLookup.findMany({ where: { id: { in: regionIds } } });
  const regionalDistribution = membersByRegion.map((m) => {
    const region = regions.find((r) => r.id === m.regionId);
    return { name: region ? region.description : "Unknown", value: m._count.regionId };
  });

  // Category Distribution
  const membersByCategory = await prisma.member.groupBy({
    by: ["typeId"],
    _count: { typeId: true },
    where: memberBaseWhere,
  });
  const categoryIds = membersByCategory.map((m) => m.typeId).filter(Boolean) as string[];
  const categories = await prisma.dataLookup.findMany({ where: { id: { in: categoryIds } } });
  const categoryDistribution = membersByCategory.map((m) => {
    const category = categories.find((c) => c.id === m.typeId);
    return { name: category ? category.description : "Unknown", value: m._count.typeId };
  });

  // Top 5 Fellowships by member count (within scope)
  const topFellowshipsData = await prisma.member.groupBy({
    by: ["councilFellowshipId"],
    _count: { councilFellowshipId: true },
    where: memberBaseWhere,
    orderBy: { _count: { councilFellowshipId: "desc" } },
    take: 5,
  });
  const fellowshipIds = topFellowshipsData.map((f) => f.councilFellowshipId);
  const fellowships = await prisma.councilFellowship.findMany({
    where: { id: { in: fellowshipIds } },
    select: { id: true, name: true },
  });
  const topFellowships = topFellowshipsData.map((f) => {
    const fw = fellowships.find((fl) => fl.id === f.councilFellowshipId);
    return { name: fw ? fw.name : "Unknown", value: f._count.councilFellowshipId };
  });

  // ── 2. Compliance (get activeReportRequest first, used in financials too) ─
  const activeReportRequest = await prisma.reportRequest.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // ── 3. Financial Overview ─────────────────────────────────────────────────
  // Scope ReportingFees by member fellowship
  const reportingFeeWhere: any = {};
  if (!isAdmin && allowedFellowshipIds.length > 0) {
    reportingFeeWhere.member = { councilFellowshipId: { in: allowedFellowshipIds } };
  }

  const reportingFees = await prisma.reportingFee.findMany({
    where: reportingFeeWhere,
    select: {
      amount: true,
      status: true,
      report: { select: { status: { select: { value: true } } } },
    },
  });

  let totalCollected = 0;
  let inReviewRevenue = 0;
  reportingFees.forEach((fee) => {
    const amt = Number(fee.amount);
    if (fee.status === "PAID") {
      totalCollected += amt;
    } else if (
      fee.status === "PENDING" ||
      fee.status === "PENDING_REVIEW" ||
      (fee.report && fee.report.status.value === "SUBMITTED")
    ) {
      inReviewRevenue += amt;
    }
  });

  // Expected revenue — scoped to this fellowship's members
  let totalExpectedRevenue = 0;
  const feeRuleWhere: any = { isActive: true };
  if (activeReportRequest) {
    feeRuleWhere.OR = [{ reportRequestId: activeReportRequest.id }, { reportRequestId: null }];
  } else {
    feeRuleWhere.reportRequestId = null;
  }
  const activeFeeRules = await prisma.feeRule.findMany({ where: feeRuleWhere });

  if (activeFeeRules.length > 0) {
    for (const rule of activeFeeRules) {
      const amount = Number(rule.amount);
      const whereClause: any = { ...memberBaseWhere };
      if (rule.memberTypeId) whereClause.typeId = rule.memberTypeId;
      if (rule.memberCategoryId) whereClause.memberCategoryId = rule.memberCategoryId;
      const memberCount = await prisma.member.count({ where: whereClause });
      totalExpectedRevenue += memberCount * amount;
    }
  }

  if (totalExpectedRevenue === 0) {
    const categoryRates = await prisma.categoryFeeRate.findMany();
    if (categoryRates.length > 0) {
      for (const rate of categoryRates) {
        const amount = Number(rate.amount);
        let cnt = await prisma.member.count({ where: { ...memberBaseWhere, memberCategoryId: rate.categoryId } });
        if (cnt === 0) {
          cnt = await prisma.member.count({ where: { ...memberBaseWhere, typeId: rate.categoryId } });
        }
        totalExpectedRevenue += cnt * amount;
      }
    }
  }

  let totalPending = 0;
  if (totalExpectedRevenue > 0) {
    totalPending = Math.max(0, totalExpectedRevenue - totalCollected - inReviewRevenue);
  }

  // ── 4. Report Compliance ──────────────────────────────────────────────────
  let reportStatusDistribution: any[] = [];
  let overallComplianceRate = 0;
  let reportsPendingReview = 0;

  if (activeReportRequest && totalMembers > 0) {
    const reportWhere: any = { reportRequestId: activeReportRequest.id };
    if (!isAdmin && allowedFellowshipIds.length > 0) {
      reportWhere.member = { councilFellowshipId: { in: allowedFellowshipIds } };
    }

    const reports = await prisma.report.findMany({
      where: reportWhere,
      include: { status: true },
    });

    const submittedCount = reports.filter(
      (r) => r.status.value !== "PENDING" && r.status.value !== "NOT_REPORTED"
    ).length;
    overallComplianceRate = Math.round((submittedCount / totalMembers) * 100);

    const statusGroups: Record<string, number> = {};
    reports.forEach((r) => {
      const statusName = r.status.description || r.status.value;
      statusGroups[statusName] = (statusGroups[statusName] || 0) + 1;
      if (r.status.value === "SUBMITTED") reportsPendingReview++;
    });

    const notSubmittedCount = totalMembers - reports.length;
    if (notSubmittedCount > 0) statusGroups["Not Submitted"] = notSubmittedCount;

    reportStatusDistribution = Object.entries(statusGroups).map(([name, value]) => ({ name, value }));
  } else if (!activeReportRequest) {
    reportStatusDistribution = [{ name: "No Active Requests", value: 1 }];
  }

  // ── 5. Engagement ─────────────────────────────────────────────────────────
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const churchUserWhere: any = { lastLoginAt: { gte: sevenDaysAgo } };
  if (!isAdmin && allowedFellowshipIds.length > 0) {
    churchUserWhere.member = { councilFellowshipId: { in: allowedFellowshipIds } };
  }
  const activeChurchUsers = await prisma.churchUser.count({ where: churchUserWhere });

  const recentActivity = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, action: true, entity: true, description: true, performedByType: true, createdAt: true },
  });

  sendSuccessResponse(res, {
    analytics: {
      totalMembers,
      diasporaMembers,
      activeFellowships,
      registrationTimeline,
      regionalDistribution,
      categoryDistribution,
      topFellowships,
      financials: {
        expectedRevenue: totalExpectedRevenue,
        collectedRevenue: totalCollected,
        inReviewRevenue,
        pendingRevenue: totalPending,
      },
      compliance: { rate: overallComplianceRate, pendingReview: reportsPendingReview, statusDistribution: reportStatusDistribution },
      engagement: { activeChurchUsers, recentActivity },
    },
  });
});

