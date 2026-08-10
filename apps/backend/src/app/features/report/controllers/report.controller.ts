import { NextFunction, Request, Response } from "express";
import { GetReportsQueryParams } from "../interfaces/query-params.interface";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import AppError from "../../../shared/errors/app.error";
import { DataLookup } from "@prisma/client";
import { ReportStatus } from "../enums/report-status.enum";
import {
  DESTINANTIONS,
  FILTERS,
  multerConfig,
  RESOURCES,
} from "../../../config/multer.config";
import { sendSuccessResponse, sendSuccessResponseWithMessage, sendPaginatedResponse } from "../../../shared/helpers/response.helper";
import { resolveFeeAndCreate } from "../../finance/services/fee-resolver.service";
import { logActivity, ActivityAction, ActivityEntity } from "../../../shared/services/activity.service";
import fs from 'fs';
import path from 'path';

const upload = multerConfig(
  RESOURCES.REPORT,
  DESTINANTIONS.FILE.REPORT,
  FILTERS.REPORT
);

// RBAC helpers
async function getAllowedFellowshipIdsByEmail(email: string): Promise<string[]> {
  const staff = await prisma.staff.findUnique({ where: { email }, select: { id: true } });
  if (!staff) return [];
  const links = await (prisma as any).staffFellowship.findMany({
    where: { staffId: staff.id },
    select: { fellowshipId: true },
  });
  return (links as Array<{ fellowshipId: string }>).map((l) => l.fellowshipId);
}
async function getAllowedFellowshipIdsFromReq(req: Request): Promise<string[]> {
  const reqAny = req as any;
  const pre = reqAny.rbac?.allowedFellowshipIds as string[] | undefined;
  if (pre && pre.length > 0) return pre;
  const email = reqAny.user?.email as string | undefined;
  if (!email) return [];
  return getAllowedFellowshipIdsByEmail(email);
}
async function assertAccessToMemberId(req: Request, memberId: string) {
  const reqAny = req as any;
  if (reqAny.isAdminRole) return;
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { councilFellowshipId: true },
  });
  if (!member) throw new AppError(`Member with ID ${memberId} does not exist`, 400);
  const allowedFellowshipIds = await getAllowedFellowshipIdsFromReq(req);
  const fellowshipId = (member as any).councilFellowshipId as string | undefined;
  if (
    Array.isArray(allowedFellowshipIds) &&
    allowedFellowshipIds.length > 0 &&
    fellowshipId &&
    !allowedFellowshipIds.includes(fellowshipId)
  ) {
    throw new AppError("Access denied for this fellowship", 403);
  }
}
async function assertAccessToFellowshipId(req: Request, fellowshipId: string) {
  const reqAny = req as any;
  if (reqAny.isAdminRole) return;
  const allowedFellowshipIds = await getAllowedFellowshipIdsFromReq(req);
  if (
    Array.isArray(allowedFellowshipIds) &&
    allowedFellowshipIds.length > 0 &&
    !allowedFellowshipIds.includes(fellowshipId)
  ) {
    throw new AppError("Access denied for this fellowship", 403);
  }
}

/**
 * Upload Middleware
 */
export const uploadReport = {
  pre: upload.single("report"),
  post: (req: Request, _: Response, next: NextFunction) => {
    console.log("req.file");
    console.log(req.file);

    if (req.file) {
      req.body.file = req.file.filename;
    }

    next();
  },
};

export const getReports = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetReportsQueryParams;
    const page = Number(query._page) || 1;
    const limit = Number(query._limit) || 5;
    const skip = (page - 1) * limit;

    const whereFilters = { ...(req as any).filters };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: whereFilters,
        include: { status: true, member: true, councilFellowship: true, reportingFee: true },
        orderBy: {
         year: "desc",
        },
        take: limit,
        skip,
        
      }),
      prisma.report.count({
        where: whereFilters,
        take: limit,
        skip,
       
      }),
    ]);
    sendPaginatedResponse(res, { reports }, { page, limit, total });
  }
);

export const getReportSummary = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const whereFilters = { ...(req as any).filters };

    const [
      totalRequests,
      activeRequests,
      totalSubmissions,
      statusCounts,
      feeSum,
      totalMembers,
      recentSubmissions,
      memberCountsByFellowship,
      reportCountsByFellowship,
      fellowships
    ] = await Promise.all([
      prisma.reportRequest.count(),
      prisma.reportRequest.count({ where: { isActive: true } }),
      prisma.report.count({ where: whereFilters }),
      prisma.report.groupBy({
        by: ['statusId'],
        _count: { id: true },
        where: whereFilters,
      }),
      (prisma as any).reportingFee.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' }
      }),
      prisma.member.count({ where: { isActive: true } }),
      prisma.report.findMany({
        where: whereFilters,
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          member: { select: { id: true, name: true } },
          status: { select: { value: true } },
          reportingFee: { select: { status: true } }
        }
      }),
      prisma.member.groupBy({
        by: ['councilFellowshipId'],
        _count: { id: true },
        where: { isActive: true, councilFellowshipId: { not: undefined } }
      }),
      prisma.report.groupBy({
        by: ['councilFellowshipId'],
        _count: { id: true },
        where: { ...whereFilters, councilFellowshipId: { not: undefined } }
      }),
      prisma.councilFellowship.findMany({ select: { id: true, name: true } })
    ]);

    // Map statusIds to their values
    const statusIds = statusCounts.map((s) => s.statusId);
    const statuses = await prisma.dataLookup.findMany({
      where: { id: { in: statusIds } }
    });

    const submissionsByStatus = statusCounts.map((sc) => ({
      status: statuses.find((s) => s.id === sc.statusId)?.value || 'UNKNOWN',
      count: sc._count.id
    }));

    // Merge fellowship data
    const submissionsByFellowship = fellowships.map(f => {
      const totalFMembers = memberCountsByFellowship.find(m => m.councilFellowshipId === f.id)?._count.id || 0;
      const reported = reportCountsByFellowship.find(r => r.councilFellowshipId === f.id)?._count.id || 0;
      return {
        fellowship: f.name,
        reported,
        notReported: Math.max(0, totalFMembers - reported),
        total: totalFMembers
      };
    })
    .filter(f => f.total > 0) // Only show fellowships that have members
    .sort((a, b) => b.reported - a.reported || b.total - a.total)
    .slice(0, 5);

    sendSuccessResponse(res, {
      summary: {
        totalRequests,
        activeRequests,
        totalSubmissions,
        submissionsByStatus,
        submissionsByFellowship,
        feesCollected: feeSum._sum.amount ? Number(feeSum._sum.amount) : 0,
        totalMembers,
        recentSubmissions,
      }
    });
  }
);

export const getReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const report = await prisma.report.findUnique({
      where: {
        id: req.params.id,
      },
      include: { status: true, member: { include: { type: { select: { value: true } } } }, councilFellowship: true, reportingFee: true },
    });

    if (!report) {
      return next(
        new AppError(`Report with ID ${req.params.id} does not exist`, 400)
      );
    }

    // RBAC check for single report
    if (report.member) {
      await assertAccessToMemberId(req, report.member.id);
    } else if (report.councilFellowshipId) {
      await assertAccessToFellowshipId(req, report.councilFellowshipId);
    }

    sendSuccessResponse(res, { report });
  }
);

export const createMemberReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let { year, member, reportedAt, file, bankReference, remark, reportRequestId } = req.body;

    const reportedStatus = await prisma.dataLookup.findUnique({
      where: { value: ReportStatus.REPORTED },
    });
    if (!reportedStatus) {
      return next(new AppError('Reported status not found in DataLookup', 500));
    }
    const reportedAtDate = new Date(reportedAt);

    // Lookup member to get councilFellowshipId
    const memberRecord = await prisma.member.findUnique({
      where: { id: member },
      select: { id: true, councilFellowshipId: true },
    });
    if (!memberRecord) {
      return next(new AppError(`Member with ID ${member} does not exist`, 400));
    }

    // RBAC enforcement for creating member report
    await assertAccessToMemberId(req, memberRecord.id);

    // Upsert logic: update if exists, else create
    const existingReport = await prisma.report.findFirst({
      where: {
        memberId: member,
        year: Number(year),
      },
    });

    if (!file && !existingReport?.file) {
      return next(new AppError('A scanned report file is required.', 400));
    }

    if (existingReport) {
      try {
        const updatedReport = await prisma.report.update({
          where: { id: existingReport.id },
          data: {
            reportedAt: reportedAtDate,
            file: file || existingReport.file,
            bankReference: bankReference || existingReport.bankReference,
            remark: remark || existingReport.remark,
            statusId: reportedStatus.id,
            ...(reportRequestId && { reportRequestId }),
          },
          include: { status: true, member: true, councilFellowship: true, reportingFee: true },
        });
        
        // Resolve fee for the updated report
        await resolveFeeAndCreate(updatedReport.id, member, updatedReport.reportRequestId);
        
        const freshReport = await prisma.report.findUnique({
          where: { id: updatedReport.id },
          include: { status: true, member: true, councilFellowship: true, reportingFee: true },
        });

        // Log activity
        await logActivity({
          action: ActivityAction.UPDATE,
          entity: ActivityEntity.REPORT,
          entityId: updatedReport.id,
          description: `Updated report for member ${member} for year ${year}`,
          metadata: { year, memberId: member, reportRequestId },
        }, req);

        sendSuccessResponseWithMessage(res, { report: freshReport }, "Report updated successfully");
        return;
      } catch (updateError) {
        return next(new AppError(`Failed to update report: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`, 500));
      }
    }

    const report = await prisma.report.create({
      data: {
        reportedAt: reportedAtDate,
        year: Number(year),
        statusId: reportedStatus.id,
        memberId: member,
        councilFellowshipId: memberRecord.councilFellowshipId,
        file: file || "",
        bankReference: bankReference || "",
        remark: remark || "",
        ...(reportRequestId && { reportRequestId }),
      },
      include: { status: true, member: true, councilFellowship: true, reportingFee: true },
    });

    await resolveFeeAndCreate(report.id, member, reportRequestId);
    
    const freshReport = await prisma.report.findUnique({
      where: { id: report.id },
      include: { status: true, member: true, councilFellowship: true, reportingFee: true },
    });

    // Log activity
    await logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.REPORT,
      entityId: report.id,
      description: `Created report for member ${member} for year ${year}`,
      metadata: { year, memberId: member, reportRequestId },
    }, req);

    sendSuccessResponse(res, { report: freshReport });
  }
);

export const createFellowshipReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);

    let { year, fellowship, file, bankReference, remark } = req.body;

    const reportedStatus = (await prisma.dataLookup.findUnique({
      where: { value: ReportStatus.REPORTED },
    })) as unknown as DataLookup;

    // RBAC enforcement for creating fellowship report
    await assertAccessToFellowshipId(req, fellowship);

    const report = await prisma.report.create({
      data: {
        year: Number(year),
        statusId: reportedStatus.id,
        councilFellowshipId: fellowship,
        file: file ? file : "",
        bankReference: bankReference ? bankReference : "",
        remark: remark ? remark : "",
      },
      include: { status: true, member: true, councilFellowship: true },
    });

    // Log activity
    await logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.REPORT,
      entityId: report.id,
      description: `Created report for fellowship ${fellowship} for year ${year}`,
      metadata: { year, fellowshipId: fellowship },
    }, req);

    sendSuccessResponse(res, { report });
  }
);

export const updateMemberReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);
const removeFile = req.body.report ==='remove'
    let { reportId, file, bankReference, remark ,reportedAt,} = req.body;
    const reportedStatus = (await prisma.dataLookup.findUnique({where:{value:ReportStatus.REPORTED}})) as unknown as DataLookup;

    // RBAC: ensure the staff can access this report before update
    const existingReportFull = await prisma.report.findUnique({
      where: { id: reportId },
      include: { member: { include: { type: { select: { value: true } } } } },
    });
    if (!existingReportFull) {
      return next(
        new AppError(`Report with ID ${reportId} does not exist`, 400)
      );
    }
    if (existingReportFull.memberId) {
      await assertAccessToMemberId(req, existingReportFull.memberId);
    } else if (existingReportFull.councilFellowshipId) {
      await assertAccessToFellowshipId(req, existingReportFull.councilFellowshipId);
    }

    const updatedData: any = {
      statusId: reportedStatus.id,
    };
    if (file) updatedData.file = file;
    if (remark) updatedData.remark = remark;
    if (bankReference) updatedData.bankReference = bankReference;
    if(reportedAt) updatedData.reportedAt = new Date(reportedAt)
      const existingReport = await prisma.report.findUnique({
        where: { id: reportId },
      });
  
      if (!existingReport) {
        return next(
          new AppError(`Report with ID ${reportId} does not exist`, 400)
        );
      }
      if(removeFile){
        const oldFilePath = existingReport.file 
        ? path.join(__dirname, "../../" +  DESTINANTIONS.FILE.REPORT, existingReport.file)
        : null;
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
            console.log(`Successfully deleted old file: ${oldFilePath}`);
          } catch (err) {
            console.error(`Error deleting old file ${oldFilePath}:`, err);
            // Optionally, you might want to return an error or log more formally
          }
        }
        updatedData.file = ""; 
      }
  // Handle file update/removal
  if (file !== undefined) { // Check if 'file' property exists in the request body
    const oldFilePath = existingReport.file 
      ? path.join(__dirname, "../../" +  DESTINANTIONS.FILE.REPORT, existingReport.file)
      : null;

  // User wants to update with a new file
      if (oldFilePath && fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`Successfully deleted old file: ${oldFilePath}`);
        } catch (err) {
          console.error(`Error deleting old file ${oldFilePath}:`, err);
          // Optionally, you might want to return an error or log more formally
        }
      }
      updatedData.file = file; // Set new file in database
    
  }
    const report = await prisma.report.update({
      where: { id: reportId },
      data: updatedData,
      include: { status: true, member: true, councilFellowship: true, reportingFee: true },
    });
    if (!report) {
      return next(
        new AppError(`Report with ID ${reportId} does not exist`, 400)
      );
    }

    // Log activity
    await logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.REPORT,
      entityId: report.id,
      description: `Updated report ${reportId}`,
      metadata: { reportId, removeFile, hasFile: !!file },
    }, req);

    sendSuccessResponse(res, { report });
  }
);
export const deleteReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const  reportId  = req.params.id;

    if (!reportId) {
      return next(new AppError('Report ID is required', 400));
    }

    // Find the report to get its details, especially the file name
    const reportToDelete = await prisma.report.findUnique({
      where: { id: reportId },
      include: { member: { include: { type: { select: { value: true } } } } },
    });

    if (!reportToDelete) {
      return next(new AppError(`Report with ID ${reportId} not found`, 404));
    }

    // RBAC enforcement before delete
    if (reportToDelete.memberId) {
      await assertAccessToMemberId(req, reportToDelete.memberId);
    } else if (reportToDelete.councilFellowshipId) {
      await assertAccessToFellowshipId(req, reportToDelete.councilFellowshipId);
    }

    // If the report has an associated file, delete it
    if (reportToDelete.file) {
      const filePath = path.join(__dirname, "../../" +  DESTINANTIONS.FILE.REPORT, reportToDelete.file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Successfully deleted file: ${filePath}`);
        } catch (err) {
          console.error(`Error deleting file ${filePath}:`, err);
         
        }
      }
    }

    // Delete the report from the database
    await prisma.report.delete({
      where: { id: reportId },
    });

    // Log activity
    await logActivity({
      action: ActivityAction.DELETE,
      entity: ActivityEntity.REPORT,
      entityId: reportId,
      description: `Deleted report ${reportId}`,
      metadata: { reportId, hadFile: !!reportToDelete.file },
    }, req);

    sendSuccessResponse(res, null, 204);
  }
);
