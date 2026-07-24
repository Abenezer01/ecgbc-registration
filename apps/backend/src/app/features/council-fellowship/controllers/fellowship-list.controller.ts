import { NextFunction, Request, Response } from "express";
import { GetFellowshipsQueryParams } from "../interfaces/query-params.interface";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import { sendPaginatedResponse } from "../../../shared/helpers/response.helper";

// Helper to get allowed fellowship IDs for the current staff
async function getAllowedFellowshipIds(email: string): Promise<string[]> {
  // Cast prisma to any to bypass mismatched generated types and fetch via junction relation
  const staff = await (prisma as any).staff.findUnique({
    where: { email },
    include: { fellowships: { select: { fellowshipId: true } } },
  });
  if (!staff || !staff.fellowships) return [];
  return (staff.fellowships as Array<{ fellowshipId: string }>).map((f) => f.fellowshipId);
}

export const getFellowshipList = catchAsync(
  async (req: Request & { user?: { email: string } }, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetFellowshipsQueryParams;
    const page = Number(query._page) || 1;
    const limit = Number(query._limit) || 20;
    const skip = (page - 1) * limit;
    const search = query._search?.toLowerCase() || "";

    const isAdmin = Boolean((req as any).isAdminRole);
    // Prefer precomputed scope from middleware if present
    const scopeIds = (req as any).rbac?.allowedFellowshipIds as string[] | undefined;
    const allowedFellowshipIds = scopeIds ?? (req.user?.email ? await getAllowedFellowshipIds(req.user.email) : []);

    // Build where clause with search and RBAC scope
    const whereClause: any = isAdmin
      ? {}
      : (allowedFellowshipIds && allowedFellowshipIds.length > 0
          ? { id: { in: allowedFellowshipIds } }
          : { id: { in: [] as string[] } });

    // Add search filter if provided
    if (search) {
      whereClause.name = {
        contains: search,
      };
    }

    if (query.regionId && query.regionId !== "all") {
      whereClause.regionId = query.regionId;
    }

    if (query.isActive && query.isActive !== "all") {
      whereClause.isActive = query.isActive === "true";
    }

    let orderBy: any = { name: "asc" };
    if (query._sort) {
      const order = query._order === "desc" ? "desc" : "asc";
      if (query._sort === "members") {
        orderBy = { _count: { members: order } };
      } else if (query._sort === "region") {
        orderBy = { region: { name: order } };
      } else {
        orderBy = { [query._sort]: order };
      }
    }

    const [fellowships, total] = await Promise.all([
      prisma.councilFellowship.findMany({
        where: whereClause,
        orderBy,
        include: { 
          boardMembers: true, 
          files: true, 
          region: true,
          _count: {
            select: { members: true },
          },
        },
        take: limit,
        skip,
      }),
      prisma.councilFellowship.count({ where: whereClause }),
    ]);

    // Add isActive field to each fellowship (default to true until migration is run)
    const fellowshipsWithStatus = fellowships.map((f: any) => ({
      ...f,
      isActive: Buffer.isBuffer(f.isActive) ? f.isActive[0] === 1 : (f.isActive === 1 || f.isActive === true || f.isActive === "1" || f.isActive == null),
    }));

    sendPaginatedResponse(
      res,
      { fellowships: fellowshipsWithStatus },
      { page, limit, total }
    );
  }
);
