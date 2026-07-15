import { Request, Response, NextFunction } from "express";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import { sendSuccessResponse } from "../../../shared/helpers/response.helper";

export const getAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // 1. Demographics & Fellowships
  const totalMembers = await prisma.member.count({ where: { isActive: true } });
  const diasporaMembers = await prisma.member.count({ where: { isActive: true, isInEthiopia: false } });
  const activeFellowships = await prisma.councilFellowship.count({ where: { isActive: true } });
  
  // Registration Timeline (in-memory grouping by month)
  const members = await prisma.member.findMany({ select: { createdAt: true } });
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const timelineMap: Record<string, number> = {};
  members.forEach(m => {
    const month = months[m.createdAt.getMonth()];
    timelineMap[month] = (timelineMap[month] || 0) + 1;
  });
  const registrationTimeline = Object.keys(timelineMap).length > 0 
    ? Object.entries(timelineMap).map(([month, count]) => ({ month, count }))
    : [{ month: months[new Date().getMonth()], count: 0 }];
    
  // Regional Distribution
  const membersByRegion = await prisma.member.groupBy({
    by: ['regionId'],
    _count: { regionId: true },
    where: { isActive: true }
  });
  const regionIds = membersByRegion.map(m => m.regionId).filter(Boolean) as string[];
  const regions = await prisma.dataLookup.findMany({ where: { id: { in: regionIds } } });
  const regionalDistribution = membersByRegion.map(m => {
    const region = regions.find(r => r.id === m.regionId);
    return {
      name: region ? region.description : "Unknown",
      value: m._count.regionId
    };
  });

  // Category Distribution
  const membersByCategory = await prisma.member.groupBy({
    by: ['typeId'],
    _count: { typeId: true },
    where: { isActive: true }
  });
  const categoryIds = membersByCategory.map(m => m.typeId).filter(Boolean) as string[];
  const categories = await prisma.dataLookup.findMany({ where: { id: { in: categoryIds } } });
  const categoryDistribution = membersByCategory.map(m => {
    const category = categories.find(c => c.id === m.typeId);
    return {
      name: category ? category.description : "Unknown",
      value: m._count.typeId
    };
  });

  // Top 5 Fellowships
  const topFellowshipsData = await prisma.member.groupBy({
    by: ['councilFellowshipId'],
    _count: { councilFellowshipId: true },
    where: { isActive: true },
    orderBy: {
      _count: { councilFellowshipId: 'desc' }
    },
    take: 5
  });
  
  const fellowshipIds = topFellowshipsData.map(f => f.councilFellowshipId);
  const fellowships = await prisma.councilFellowship.findMany({
    where: { id: { in: fellowshipIds } },
    select: { id: true, name: true }
  });
  
  const topFellowships = topFellowshipsData.map(f => {
    const fw = fellowships.find(fl => fl.id === f.councilFellowshipId);
    return {
      name: fw ? fw.name : "Unknown",
      value: f._count.councilFellowshipId
    };
  });

  // 3. Compliance & Reporting (move this up to get activeReportRequest for financials)
  const activeReportRequest = await prisma.reportRequest.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  // 2. Financial Overview
  const reportingFees = await prisma.reportingFee.findMany({
    select: { 
      amount: true, 
      status: true,
      report: {
        select: {
          status: {
            select: { value: true }
          }
        }
      }
    }
  });
  
  let totalCollected = 0;
  let inReviewRevenue = 0;
  
  reportingFees.forEach(fee => {
    const amt = Number(fee.amount);
    if (fee.status === 'PAID') {
      totalCollected += amt;
    } else if (
      fee.status === 'PENDING' || 
      fee.status === 'PENDING_REVIEW' || 
      (fee.report && fee.report.status.value === 'SUBMITTED')
    ) {
      inReviewRevenue += amt;
    }
  });
  
  // Calculate expected revenue by multiplying member count with active fee rules
  let totalExpectedRevenue = 0;
  
  // Find all active fee rules, prioritizing ones linked to the current request, or global ones (reportRequestId: null)
  const feeRuleWhere: any = { isActive: true };
  if (activeReportRequest) {
    feeRuleWhere.OR = [
      { reportRequestId: activeReportRequest.id },
      { reportRequestId: null }
    ];
  } else {
    feeRuleWhere.reportRequestId = null;
  }

  const activeFeeRules = await prisma.feeRule.findMany({
    where: feeRuleWhere
  });

  if (activeFeeRules.length > 0) {
    for (const rule of activeFeeRules) {
      const amount = Number(rule.amount);
      const whereClause: any = { isActive: true };
      
      if (rule.memberTypeId) whereClause.typeId = rule.memberTypeId;
      if (rule.memberCategoryId) whereClause.memberCategoryId = rule.memberCategoryId;
      
      const memberCount = await prisma.member.count({ where: whereClause });
      totalExpectedRevenue += (memberCount * amount);
    }
  }
  
  // If no fee rules are found, try CategoryFeeRate
  if (totalExpectedRevenue === 0) {
    const categoryRates = await prisma.categoryFeeRate.findMany();
    if (categoryRates.length > 0) {
      for (const rate of categoryRates) {
        const amount = Number(rate.amount);
        let memberCount = await prisma.member.count({
          where: { isActive: true, memberCategoryId: rate.categoryId }
        });
        
        // If memberCategoryId doesn't match, maybe the rate is linked to typeId
        if (memberCount === 0) {
          memberCount = await prisma.member.count({
            where: { isActive: true, typeId: rate.categoryId }
          });
        }
        
        totalExpectedRevenue += (memberCount * amount);
      }
    }
  }
  
  // Calculate pending revenue as the difference between expected and collected
  let totalPending = 0;
  if (totalExpectedRevenue > 0) {
    totalPending = totalExpectedRevenue - totalCollected - inReviewRevenue;
    if (totalPending < 0) totalPending = 0;
  }
  
  let reportStatusDistribution: any[] = [];
  let overallComplianceRate = 0;
  let reportsPendingReview = 0;

  if (activeReportRequest && totalMembers > 0) {
    const reports = await prisma.report.findMany({
      where: { reportRequestId: activeReportRequest.id },
      include: { status: true }
    });
    
    const submittedCount = reports.filter(r => r.status.value !== 'PENDING' && r.status.value !== 'NOT_REPORTED').length;
    overallComplianceRate = Math.round((submittedCount / totalMembers) * 100);
    
    const statusGroups: Record<string, number> = {};
    reports.forEach(r => {
      const statusName = r.status.description || r.status.value;
      statusGroups[statusName] = (statusGroups[statusName] || 0) + 1;
      if (r.status.value === 'SUBMITTED') {
        reportsPendingReview++;
      }
    });
    
    const notSubmittedCount = totalMembers - reports.length;
    if (notSubmittedCount > 0) {
      statusGroups['Not Submitted'] = notSubmittedCount;
    }
    
    reportStatusDistribution = Object.entries(statusGroups).map(([name, value]) => ({ name, value }));
  } else if (!activeReportRequest) {
    reportStatusDistribution = [{ name: 'No Active Requests', value: 1 }];
  }

  // 4. Activity & Engagement
  // Active Church Portals (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const activeChurchUsers = await prisma.churchUser.count({
    where: { lastLoginAt: { gte: sevenDaysAgo } }
  });

  const recentActivity = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      action: true,
      entity: true,
      description: true,
      performedByType: true,
      createdAt: true
    }
  });

  const analytics = {
    // Demographics
    totalMembers,
    diasporaMembers,
    activeFellowships,
    registrationTimeline,
    regionalDistribution,
    categoryDistribution,
    topFellowships,
    
    // Financials
    financials: {
      expectedRevenue: totalExpectedRevenue,
      collectedRevenue: totalCollected,
      inReviewRevenue: inReviewRevenue,
      pendingRevenue: totalPending
    },
    
    // Compliance
    compliance: {
      rate: overallComplianceRate,
      pendingReview: reportsPendingReview,
      statusDistribution: reportStatusDistribution
    },
    
    // Engagement
    engagement: {
      activeChurchUsers,
      recentActivity
    }
  };

  sendSuccessResponse(res, { analytics });
});
