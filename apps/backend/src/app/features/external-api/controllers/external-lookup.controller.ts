import { Request, Response } from "express";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";

export const getMetadataLookups = catchAsync(async (req: Request, res: Response) => {
  const [types, categories, regions, fellowships] = await Promise.all([
    prisma.dataLookup.findMany({
      where: { category: "MEMBER_TYPE" },
      select: { id: true, value: true, description: true },
      orderBy: { index: "asc" },
    }),
    prisma.dataLookup.findMany({
      where: { category: "MEMBER_CATEGORY" },
      select: { id: true, value: true, description: true },
      orderBy: { index: "asc" },
    }),
    prisma.dataLookup.findMany({
      where: { category: "REGION" },
      select: { id: true, value: true, description: true },
      orderBy: { index: "asc" },
    }),
    prisma.councilFellowship.findMany({
      where: { isActive: true },
      select: { id: true, name: true, certificateNo: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return res.status(200).json({
    status: "success",
    data: {
      memberTypes: types,
      memberCategories: categories,
      regions,
      fellowships,
    },
  });
});
