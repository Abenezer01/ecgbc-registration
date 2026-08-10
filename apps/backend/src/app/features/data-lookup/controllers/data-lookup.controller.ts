import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../config/error.config";
import prisma from "../../../config/db.config";
import { sendPaginatedResponse, sendSuccessResponse } from "../../../shared/helpers/response.helper";
import { logActivity, ActivityAction, ActivityEntity } from "../../../shared/services/activity.service";

export const getDataLookups = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(`filter`,req.filters);
    
    const [lookups, total] = await Promise.all([prisma.dataLookup.findMany({
      where: {...req.filters},
    }),
    prisma.dataLookup.count({where:{...req.filters}})]
)

    sendPaginatedResponse(res, { lookups }, { page: 1, limit: total, total });
  }
);

export const createDataLookup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { type, category, value, description, note, isDefault, index, isRequired } = req.body;

    const lookup = await prisma.dataLookup.create({
      data: {
        type,
        category,
        value,
        description,
        note,
        isDefault: isDefault || false,
        isRequired: isRequired || false,
        index: index || 0,
      },
    });

    // Log activity
    await logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.DATA_LOOKUP,
      entityId: lookup.id,
      description: `Created data lookup ${value} (${type}/${category})`,
      metadata: { type, category, value, description },
    }, req);

    sendSuccessResponse(res, { lookup });
  }
);

export const updateDataLookup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { type, category, value, description, note, isDefault, index, isRequired } = req.body;

    const lookup = await prisma.dataLookup.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(category && { category }),
        ...(value && { value }),
        ...(description && { description }),
        ...(note !== undefined && { note }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isRequired !== undefined && { isRequired }),
        ...(index !== undefined && { index }),
      },
    });

    // Log activity
    await logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.DATA_LOOKUP,
      entityId: lookup.id,
      description: `Updated data lookup ${lookup.value} (${lookup.type}/${lookup.category})`,
      metadata: { type, category, value, description },
    }, req);

    sendSuccessResponse(res, { lookup });
  }
);

export const deleteDataLookup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Get the lookup before deleting for logging
    const lookup = await prisma.dataLookup.findUnique({
      where: { id },
    });

    await prisma.dataLookup.delete({
      where: { id },
    });

    // Log activity
    await logActivity({
      action: ActivityAction.DELETE,
      entity: ActivityEntity.DATA_LOOKUP,
      entityId: id,
      description: `Deleted data lookup ${lookup?.value} (${lookup?.type}/${lookup?.category})`,
      metadata: { type: lookup?.type, category: lookup?.category, value: lookup?.value },
    }, req);

    sendSuccessResponse(res, { message: "Data lookup deleted successfully" });
  }
);
