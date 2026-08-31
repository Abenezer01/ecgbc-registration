import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../config/error.config";
import prisma from "../../../config/db.config";
import { sendPaginatedResponse } from "../../../shared/helpers/response.helper";

/**
 * Get activity logs with pagination and filtering
 */
export const getActivityLogs = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { 
      _page = 1, 
      _limit = 20, 
      action, 
      entity, 
      entityId,
      performedBy, 
      startDate, 
      endDate,
      search 
    } = req.query;
    
    const page = Number(_page);
    const limit = Number(_limit);
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (action) where.action = action as string;
    if (entity) where.entity = entity as string;
    if (entityId) where.entityId = entityId as string;
    if (performedBy) where.performedBy = performedBy as string;
    
    // Date range filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    // Search across description and metadata
    if (search) {
      where.OR = [
        { description: { contains: search as string, mode: 'insensitive' } },
        { action: { contains: search as string, mode: 'insensitive' } },
        { entity: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.activity.count({ where }),
    ]);

    // Enrich logs with performer details
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        let performerName = null;
        let performerEmail = null;
        
        if (log.performedByType === 'STAFF' && log.performedBy) {
          const staff = await prisma.staff.findUnique({
            where: { id: log.performedBy },
            select: { firstName: true, lastName: true, email: true },
          });
          if (staff) {
            performerName = `${staff.firstName} ${staff.lastName}`;
            performerEmail = staff.email;
          }
        } else if (log.performedByType === 'CHURCH_USER' && log.performedBy) {
          const churchUser = await prisma.churchUser.findUnique({
            where: { id: log.performedBy },
            select: { firstName: true, lastName: true, email: true },
          });
          if (churchUser) {
            performerName = `${churchUser.firstName} ${churchUser.lastName}`;
            performerEmail = churchUser.email;
          }
        }
        
        return {
          ...log,
          performerName,
          performerEmail,
          metadata: log.metadata ? JSON.parse(log.metadata) : null,
        };
      })
    );

    sendPaginatedResponse(res, { logs: enrichedLogs }, { page, limit, total, totalPages: Math.ceil(total / limit) });
  }
);

/**
 * Get single activity log by ID
 */
export const getActivityLog = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const log = await prisma.activity.findUnique({
      where: { id },
    });

    if (!log) {
      return res.status(404).json({
        status: "error",
        message: "Activity log not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: { log },
    });
  }
);
