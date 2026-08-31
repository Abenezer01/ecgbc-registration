import { Request, Response, NextFunction } from "express";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import AppError from "../../../shared/errors/app.error";
import { sendSuccessResponse } from "../../../shared/helpers/response.helper";
import { logActivity, ActivityAction, ActivityEntity } from "../../../shared/services/activity.service";
import { resolveFeeAndCreate, previewFee } from "../../finance/services/fee-resolver.service";

/**
 * Get church portal files (authenticated church user's member files)
 */
export const getChurchPortalFiles = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const churchUserReq = req as any;
    const churchUser = churchUserReq.churchUser;

    const files = await prisma.file.findMany({
      where: { memberId: churchUser.memberId },
      orderBy: { createdAt: "desc" },
    });

    sendSuccessResponse(res, { files });
  }
);

/**
 * Get active report requests for the church
 */
export const getChurchPortalReportRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const churchUserReq = req as any;
    const churchUser = churchUserReq.churchUser;

    const requests = await prisma.reportRequest.findMany({
      where: { isActive: true },
      orderBy: { dueDate: "asc" },
      include: {
        reports: {
          where: { memberId: churchUser.memberId },
          select: { id: true }
        }
      }
    });

    sendSuccessResponse(res, { requests });
  }
);

/**
 * Get church portal reports (authenticated church user's member reports)
 */
export const getChurchPortalReports = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const churchUserReq = req as any;
    const churchUser = churchUserReq.churchUser;

    const reports = await prisma.report.findMany({
      where: { memberId: churchUser.memberId },
      include: {
        status: true,
        reportingFee: {
          select: {
            id: true,
            amount: true,
            currency: true,
            currentActionState: true,
          }
        }
      },
      orderBy: { year: "desc" },
    });

    sendSuccessResponse(res, { reports });
  }
);

/**
 * Create church portal report
 */
export const createChurchPortalReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const churchUserReq = req as any;
    const churchUser = churchUserReq.churchUser;
    const { year, bankReference, reportedAt, remark, reportRequestId } = req.body;
    const reportFile = req.file;

    // Enforce bank reference uniqueness
    if (bankReference) {
      const existing = await prisma.report.findFirst({
        where: { bankReference },
      });
      if (existing) {
        return next(new AppError(`Bank reference "${bankReference}" has already been used. Please provide a unique bank reference number.`, 409));
      }
    }

    // Get the default REPORTED status from DataLookup
    const reportedStatus = await prisma.dataLookup.findFirst({
      where: { value: "reported", type: "report_state" },
    });

    if (!reportedStatus) {
      throw new AppError("Default report status not found in system settings.", 500);
    }

    const report = await prisma.report.create({
      data: {
        year: Number(year),
        bankReference: bankReference || null,
        reportedAt: reportedAt ? new Date(reportedAt) : new Date(),
        remark: remark || null,
        file: reportFile?.filename || null,
        memberId: churchUser.memberId,
        statusId: reportedStatus.id,
        ...(reportRequestId && { reportRequestId }),
      },
      include: {
        status: true,
        reportingFee: {
          select: {
            id: true,
            amount: true,
            currency: true,
            currentActionState: true,
          }
        }
      }
    });

    // Attempt to automatically resolve and create a ReportingFee based on FeeRules
    await resolveFeeAndCreate(report.id, churchUser.memberId, reportRequestId);

    // Fetch the report again to include the newly generated fee (if any)
    const updatedReport = await prisma.report.findUnique({
      where: { id: report.id },
      include: {
        status: true,
        reportingFee: {
          select: {
            id: true,
            amount: true,
            currency: true,
            currentActionState: true,
          }
        }
      }
    });

    // Log activity
    await logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.REPORT,
      entityId: report.id,
      description: `Church user created report for year ${year}`,
      metadata: { year, memberId: churchUser.memberId, reportRequestId },
    }, req);

    sendSuccessResponse(res, { report: updatedReport || report });
  }
);

/**
 * Preview fee for a report request before submission
 */
export const getChurchPortalFeePreview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const churchUserReq = req as any;
    const churchUser = churchUserReq.churchUser;
    const { reportRequestId } = req.query;

    const preview = await previewFee(
      churchUser.memberId,
      reportRequestId as string | undefined
    );

    sendSuccessResponse(res, { preview });
  }
);

/**
 * Get church profile
 */
export const getChurchProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const churchUserReq = req as any;
    const churchUser = churchUserReq.churchUser;

    const member = await prisma.member.findUnique({
      where: { id: churchUser.memberId },
      include: {
        councilFellowship: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!member) {
      throw new AppError("Church member not found", 404);
    }

    sendSuccessResponse(res, member);
  }
);

/**
 * Update church profile
 */
export const updateChurchProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const churchUserReq = req as any;
    const churchUser = churchUserReq.churchUser;
    const { name, address, phone, email } = req.body;

    const updatedMember = await prisma.member.update({
      where: { id: churchUser.memberId },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(phone && { phone }),
        ...(email && { email }),
      },
    });

    // Log activity
    await logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.MEMBER,
      entityId: updatedMember.id,
      description: `Church user updated profile`,
      metadata: { memberId: churchUser.memberId, name, address, phone, email },
    }, req);

    sendSuccessResponse(res, updatedMember);
  }
);

/**
 * Get dashboard statistics
 */
export const getDashboardStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const churchUserReq = req as any;
    const churchUser = churchUserReq.churchUser;

    const [fileCount, reportCount, recentActivity] = await Promise.all([
      prisma.file.count({ where: { memberId: churchUser.memberId } }),
      prisma.report.count({ where: { memberId: churchUser.memberId } }),
      prisma.report.findMany({
        where: { memberId: churchUser.memberId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          year: true,
          createdAt: true,
        },
      }),
    ]);

    sendSuccessResponse(res, {
      fileCount,
      reportCount,
      recentActivity,
    });
  }
);

/**
 * Submit payment info (CRV) for a report
 * Submit payment info (bankReference) for a report
 */
export const submitReportPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const churchUserReq = req as any;
    const churchUser = churchUserReq.churchUser;
    const { id } = req.params;
    const { bankReference } = req.body;

    if (!bankReference) {
      return next(new AppError("Bank Reference number is required", 400));
    }

    // Enforce bank reference uniqueness (exclude the current report from the check)
    const duplicateRef = await prisma.report.findFirst({
      where: { bankReference, NOT: { id } },
    });
    if (duplicateRef) {
      return next(new AppError(`Bank reference "${bankReference}" has already been used. Please provide a unique bank reference number.`, 409));
    }

    const report = await prisma.report.findFirst({
      where: { id, memberId: churchUser.memberId },
      include: { reportingFee: true },
    });

    if (!report) {
      return next(new AppError("Report not found", 404));
    }

    if (!report.reportingFee) {
      return next(new AppError("No fee generated for this report yet", 400));
    }

    // Update the report with the bankReference
    const updatedReport = await prisma.report.update({
      where: { id },
      data: { bankReference },
      include: {
        status: true,
        reportingFee: true,
      }
    });

    if (updatedReport.reportingFee) {
      await (prisma as any).reportingFee.update({
        where: { id: updatedReport.reportingFee.id },
        data: { currentActionState: "PROCESSING" }
      });
      
      // Also add an ActionState record so the timeline shows the church submitted it
      // Wait, we don't have the church user ID as staffId. So we'll skip ActionState for now or use system ID.
    }

    // Log activity
    await logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.REPORT,
      entityId: updatedReport.id,
      description: `Church user submitted payment reference for report ${updatedReport.year}`,
      metadata: { reportId: id, year: updatedReport.year, bankReference },
    }, req);

    sendSuccessResponse(res, { report: updatedReport });
  }
);
