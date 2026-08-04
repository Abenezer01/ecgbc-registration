import { Request, Response, NextFunction } from "express";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import AppError from "../../../shared/errors/app.error";
import { sendSuccessResponse, sendPaginatedResponse } from "../../../shared/helpers/response.helper";
import { calculateExpectedFeeForMember } from "../../finance/services/fee-resolver.service";

/**
 * Get all Report Requests
 */
export const getReportRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = Number(req.query._page) || 1;
    const limit = Number(req.query._limit) || 20;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.reportRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          _count: {
            select: { reports: true }
          }
        }
      }),
      prisma.reportRequest.count(),
    ]);

    sendPaginatedResponse(res, { requests }, { page, limit, total });
  }
);

/**
 * Get a single Report Request with reported and not-reported members
 */
export const getReportRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const request = await prisma.reportRequest.findUnique({ where: { id } });
    if (!request) {
      return next(new AppError("Report Request not found", 404));
    }

    // Reports that are associated with this request and linked to members
    const reported = await prisma.report.findMany({
      where: { reportRequestId: id, memberId: { not: null } },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            certificateNo: true,
            councilFellowshipId: true,
            memberCategoryId: true,
            typeId: true,
            isActive: true,
          },
        },
        reportingFee: {
          select: { id: true, amount: true, currency: true, status: true },
        },
      },
    });

    const reportedMemberIds = reported
      .map((r) => (r.memberId ? r.memberId : null))
      .filter(Boolean) as string[];

    // Members who have not submitted a report for this request (active members only)
    const notReportedWhere: any = { isActive: true };
    if (reportedMemberIds.length > 0) {
      notReportedWhere.NOT = { id: { in: reportedMemberIds } };
    }

    const notReported = await prisma.member.findMany({
      where: notReportedWhere,
      select: {
        id: true,
        name: true,
        certificateNo: true,
        councilFellowshipId: true,
        memberCategoryId: true,
        typeId: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    let potentialAdditionalRevenue = 0;
    if (request.feeMode !== "NONE" && request.feeMode !== "MANUAL") {
      const rules = await (prisma as any).feeRule.findMany({
        where: {
          isActive: true,
          OR: [{ reportRequestId: id }, { reportRequestId: null }],
        },
        include: {
          fellowships: { select: { id: true } },
        },
        orderBy: { priority: "desc" },
      });

      notReported.forEach((member) => {
        const rule = calculateExpectedFeeForMember(member, rules, id);
        if (rule && rule.amount) {
          potentialAdditionalRevenue += Number(rule.amount);
        }
      });
    }

    sendSuccessResponse(res, { request, reported, notReported, potentialAdditionalRevenue });
  }
);

/**
 * Create a new Report Request
 */
export const createReportRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title, description, year, dueDate, isActive } = req.body;

    if (!title || !year || !dueDate) {
      return next(new AppError("Title, year, and dueDate are required", 400));
    }

    const request = await prisma.reportRequest.create({
      data: {
        title,
        description,
        year: Number(year),
        dueDate: new Date(dueDate),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    sendSuccessResponse(res, { request }, 201);
  }
);

/**
 * Update a Report Request
 */
export const updateReportRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { title, description, year, dueDate, isActive } = req.body;

    const existing = await prisma.reportRequest.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError("Report Request not found", 404));
    }

    const request = await prisma.reportRequest.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(year && { year: Number(year) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    sendSuccessResponse(res, { request });
  }
);

/**
 * Delete a Report Request
 */
export const deleteReportRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const existing = await prisma.reportRequest.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError("Report Request not found", 404));
    }

    await prisma.reportRequest.delete({ where: { id } });

    sendSuccessResponse(res, null, 204);
  }
);
