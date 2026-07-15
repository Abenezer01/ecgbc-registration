import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../config/error.config";
import { GetReportsQueryParams } from "../interfaces/query-params.interface";
import { IFilter } from "../../../shared/interfaces/filter.interface";

export const getReports = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetReportsQueryParams;

    // Build structured Prisma where using AND/OR to support RBAC + query params
    const andClauses: any[] = [];

    // Query param filters
    if (query.memberId) {
      andClauses.push({ memberId: query.memberId });
    }
    if (query.fellowshipId) {
      andClauses.push({ councilFellowshipId: query.fellowshipId });
    }

    // RBAC scoping: if middleware populated rbac scope, restrict queries accordingly
    const isAdmin = Boolean((req as any).isAdminRole);
    const rbac = (req as any).rbac as { allowedFellowshipIds?: string[]; allowedCategoryIds?: string[] } | undefined;
    if (!isAdmin && rbac) {
      const { allowedFellowshipIds = [], allowedCategoryIds = [] } = rbac;

      if (allowedFellowshipIds.length > 0) {
        // Accept reports linked either directly to allowed fellowships OR via their member's fellowship
        andClauses.push({
          OR: [
            { councilFellowshipId: { in: allowedFellowshipIds } },
            { member: { councilFellowshipId: { in: allowedFellowshipIds } } },
          ],
        });
      }

      if (allowedCategoryIds.length > 0) {
        // Apply category scope only for member reports
        andClauses.push({ member: { memberCategoryId: { in: allowedCategoryIds } } });
      }
    }

    const filters: IFilter = andClauses.length > 0 ? { AND: andClauses } : {};

    // Attach to request for controller usage
    req.filters = filters;
    next();
  }
);
