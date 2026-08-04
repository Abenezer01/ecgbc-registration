import prisma from "../../../config/db.config";
import { Decimal } from "@prisma/client/runtime/library";

interface FeePreviewResult {
  feeMode: string;
  amount?: string;
  currency?: string;
  isLate?: boolean;
}

export async function previewFee(
  memberId: string,
  reportRequestId: string | null | undefined
): Promise<FeePreviewResult | null> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      typeId: true,
      memberCategoryId: true,
      councilFellowshipId: true,
    },
  });

  if (!member) return null;

  let feeMode = "AUTO";
  let dueDate: Date | null = null;

  if (reportRequestId) {
    const request = await prisma.reportRequest.findUnique({
      where: { id: reportRequestId },
      select: { feeMode: true, dueDate: true },
    });
    if (request) {
      feeMode = request.feeMode;
      dueDate = request.dueDate;
    }
  }

  if (feeMode === "NONE") return { feeMode };

  if (feeMode === "MANUAL") {
    return { feeMode, amount: "0", currency: "ETB" };
  }

  const rules = await (prisma as any).feeRule.findMany({
    where: {
      isActive: true,
      OR: [
        { reportRequestId: reportRequestId ?? null },
        { reportRequestId: null },
      ],
    },
    include: {
      fellowships: { select: { id: true } }
    },
    orderBy: { priority: "desc" },
  });

  if (!rules || rules.length === 0) return null;

  const scored = rules
    .map((rule: any) => {
      let score = rule.priority * 100;
      const typeMatch = rule.memberTypeId === null || rule.memberTypeId === member.typeId;
      const categoryMatch = rule.memberCategoryId === null || rule.memberCategoryId === member.memberCategoryId;
      const ruleFellowshipIds = rule.fellowships.map((f: any) => f.id);
      const fellowshipMatch = ruleFellowshipIds.length === 0 || ruleFellowshipIds.includes(member.councilFellowshipId);
      const requestMatch = rule.reportRequestId === null || rule.reportRequestId === reportRequestId;

      if (!typeMatch || !categoryMatch || !fellowshipMatch || !requestMatch) return null;

      if (ruleFellowshipIds.length > 0) score += 40;
      if (rule.memberTypeId) score += 20;
      if (rule.memberCategoryId) score += 10;
      if (rule.reportRequestId) score += 30;

      return { rule, score };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.score - a.score);

  if (scored.length === 0) return null;

  const bestRule = scored[0].rule;
  const isLate = dueDate ? new Date() > new Date(dueDate) : false;
  const baseAmount = new Decimal(bestRule.amount);
  const finalAmount =
    isLate && bestRule.lateFeeMultiplier
      ? baseAmount.mul(new Decimal(bestRule.lateFeeMultiplier))
      : baseAmount;

  return {
    feeMode,
    amount: finalAmount.toString(),
    currency: bestRule.currency,
    isLate,
  };
}

/**
 * Resolves the best matching FeeRule for a given member + report request
 * and creates a ReportingFee record.
 */
export function calculateExpectedFeeForMember(member: any, rules: any[], reportRequestId: string | null): any | null {
  const scored = rules
    .map((rule: any) => {
      let score = rule.priority * 100;
      const typeMatch = rule.memberTypeId === null || rule.memberTypeId === member.typeId;
      const categoryMatch = rule.memberCategoryId === null || rule.memberCategoryId === member.memberCategoryId;
      const ruleFellowshipIds = rule.fellowships ? rule.fellowships.map((f: any) => f.id) : [];
      const fellowshipMatch = ruleFellowshipIds.length === 0 || ruleFellowshipIds.includes(member.councilFellowshipId);
      const requestMatch = rule.reportRequestId === null || rule.reportRequestId === reportRequestId;

      if (!typeMatch || !categoryMatch || !fellowshipMatch || !requestMatch) return null;

      if (ruleFellowshipIds.length > 0) score += 40;
      if (rule.memberTypeId) score += 20;
      if (rule.memberCategoryId) score += 10;
      if (rule.reportRequestId) score += 30;

      return { rule, score };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.score - a.score);

  if (scored.length === 0) return null;
  return scored[0].rule;
}

export async function resolveFeeAndCreate(
  reportId: string,
  memberId: string,
  reportRequestId: string | null | undefined
): Promise<void> {
  const [member, report] = await Promise.all([
    prisma.member.findUnique({
      where: { id: memberId },
      select: {
        typeId: true,
        memberCategoryId: true,
        councilFellowshipId: true,
      },
    }),
    prisma.report.findUnique({
      where: { id: reportId },
      select: { bankReference: true },
    })
  ]);

  if (!member) return;

  const initialStatus = report?.bankReference ? "PAID" : "PENDING";

  let feeMode = "AUTO";
  let dueDate: Date | null = null;

  if (reportRequestId) {
    const request = await prisma.reportRequest.findUnique({
      where: { id: reportRequestId },
      select: { feeMode: true, dueDate: true },
    });
    if (request) {
      feeMode = request.feeMode;
      dueDate = request.dueDate;
    }
  }

  if (feeMode === "NONE") return;

  if (feeMode === "MANUAL") {
    await prisma.reportingFee.upsert({
      where: { reportId },
      update: {},
      create: {
        reportId,
        memberId,
        amount: new Decimal(0),
        currency: "ETB",
        status: initialStatus,
        isOverridden: false,
        ...(initialStatus === "PAID" ? { paidAt: new Date() } : {}),
      },
    });
    return;
  }

  const rules = await (prisma as any).feeRule.findMany({
    where: {
      isActive: true,
      OR: [
        { reportRequestId: reportRequestId ?? null },
        { reportRequestId: null },
      ],
    },
    include: {
      fellowships: { select: { id: true } }
    },
    orderBy: { priority: "desc" },
  });

  if (!rules || rules.length === 0) return;

  const bestRule = calculateExpectedFeeForMember(member, rules, reportRequestId ?? null);

  if (!bestRule) return;

  const isLate = dueDate ? new Date() > new Date(dueDate) : false;
  const baseAmount = new Decimal(bestRule.amount);
  const finalAmount =
    isLate && bestRule.lateFeeMultiplier
      ? baseAmount.mul(new Decimal(bestRule.lateFeeMultiplier))
      : baseAmount;

  await prisma.reportingFee.upsert({
    where: { reportId },
    update: {
      amount: finalAmount,
      baseAmount,
      currency: bestRule.currency,
      feeRuleId: bestRule.id,
      isLate,
      isOverridden: false,
    },
    create: {
      reportId,
      memberId,
      amount: finalAmount,
      baseAmount,
      currency: bestRule.currency,
      feeRuleId: bestRule.id,
      isLate,
      status: initialStatus,
      isOverridden: false,
      ...(initialStatus === "PAID" ? { paidAt: new Date() } : {}),
    },
  });
}
