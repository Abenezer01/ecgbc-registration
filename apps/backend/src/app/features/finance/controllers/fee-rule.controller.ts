import { Request, Response } from "express";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";

export const getFeeRules = catchAsync(async (req: Request, res: Response) => {
  const rules = await (prisma as any).feeRule.findMany({
    include: {
      memberType: true,
      memberCategory: true,
      fellowships: true,
      reportRequest: true,
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  res.status(200).json({
    status: "success",
    data: { rules },
  });
});

export const createFeeRule = catchAsync(async (req: Request, res: Response) => {
  const {
    name,
    memberTypeId,
    memberCategoryId,
    fellowshipIds,
    reportRequestId,
    currency,
    amount,
    lateFeeMultiplier,
    priority,
    isActive,
  } = req.body;

  const rule = await (prisma as any).feeRule.create({
    data: {
      name,
      memberTypeId: memberTypeId || null,
      memberCategoryId: memberCategoryId || null,
      fellowships: Array.isArray(fellowshipIds) && fellowshipIds.length > 0
        ? { connect: fellowshipIds.map((id: string) => ({ id })) }
        : undefined,
      reportRequestId: reportRequestId || null,
      currency,
      amount,
      lateFeeMultiplier: lateFeeMultiplier || null,
      priority,
      isActive,
    },
    include: { fellowships: true },
  });

  res.status(201).json({
    status: "success",
    data: { rule },
  });
});

export const updateFeeRule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fellowshipIds, ...data } = req.body;

  // Convert empty strings to null for optional relations
  if ("memberTypeId" in data && data.memberTypeId === "") data.memberTypeId = null;
  if ("memberCategoryId" in data && data.memberCategoryId === "") data.memberCategoryId = null;
  if ("reportRequestId" in data && data.reportRequestId === "") data.reportRequestId = null;
  if ("lateFeeMultiplier" in data && data.lateFeeMultiplier === "") data.lateFeeMultiplier = null;

  const rule = await (prisma as any).feeRule.update({
    where: { id },
    data: {
      ...data,
      ...(fellowshipIds !== undefined && {
        fellowships: {
          set: (fellowshipIds as string[]).map((fid) => ({ id: fid })),
        },
      }),
    },
    include: { fellowships: true },
  });

  res.status(200).json({
    status: "success",
    data: { rule },
  });
});

export const deleteFeeRule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await (prisma as any).feeRule.delete({
    where: { id },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const generateMissingFees = catchAsync(async (req: Request, res: Response) => {
  const { reportRequestId } = req.params;

  const request = await prisma.reportRequest.findUnique({
    where: { id: reportRequestId },
  });

  if (!request) {
    return res.status(404).json({ status: "fail", message: "Report request not found" });
  }

  // Get all members who haven't submitted a report for this request
  const membersWithoutReport = await prisma.member.findMany({
    where: {
      isActive: true,
      reports: {
        none: { reportRequestId },
      },
    },
    select: { id: true },
  });

  let generatedCount = 0;
  
  // To avoid circular dependency, we should import the resolver dynamically or at the top
  const { resolveFeeAndCreate } = await import("../services/fee-resolver.service");

  for (const member of membersWithoutReport) {
    // We create a dummy unsubmitted report for them to attach the fee?
    // Wait, ReportingFee requires a ReportId. If they haven't submitted, they don't have a report.
    // We need to create an auto-generated "NOT SUBMITTED" report.
    
    // First, find the "NOT_REPORTED" or "PENDING" status
    const pendingStatus = await prisma.dataLookup.findFirst({
      where: { value: "PENDING", type: "REPORT_STATUS" },
    });

    if (!pendingStatus) continue;

    const report = await prisma.report.create({
      data: {
        year: request.year,
        memberId: member.id,
        statusId: pendingStatus.id,
        reportRequestId: request.id,
      },
    });

    await resolveFeeAndCreate(report.id, member.id, request.id);
    generatedCount++;
  }

  res.status(200).json({
    status: "success",
    message: `Generated ${generatedCount} missing reports and fees.`,
    data: { count: generatedCount },
  });
});
