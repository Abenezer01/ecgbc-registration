import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../config/error.config";
import prisma from "../../../config/db.config";
import { sendPaginatedResponse } from "../../../shared/helpers/response.helper";

export const getPermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    
    const [permissions, total] = await Promise.all([prisma.permission.findMany({where:{...req.filters}}),prisma.permission.count({where:{...req.filters}})] )

    sendPaginatedResponse(res, { permissions }, { page: 1, limit: total, total });
  }
);
