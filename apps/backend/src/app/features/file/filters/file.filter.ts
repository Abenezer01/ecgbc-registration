import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../config/error.config";
import { GetFilesQueryParams } from "../interfaces/query-params.interface";
import { IFilter } from "../../../shared/interfaces/filter.interface";

export const getFiles = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetFilesQueryParams;
    let filters: IFilter = {};

    for (const key in query) {
      if (["memberId", "fellowshipId"].includes(key)) {
        const value = query[key as keyof GetFilesQueryParams];
        const filterKey = key === 'fellowshipId' ? 'councilFellowshipId' : key;
        filters = {
          ...filters,
          [filterKey]: value,
        };
      }
    }

    // If memberId is present, also include files for the member's councilFellowshipId
    if (query.memberId) {
      // Fetch the member's councilFellowshipId from the DB
      const prisma = require("../../../config/db.config").default;
      const member = await prisma.member.findUnique({
        where: { id: query.memberId },
        select: { councilFellowshipId: true },
      });
      if (member && member.councilFellowshipId) {
        // Only use OR for memberId and councilFellowshipId, do not merge with other filters
        filters = {
          OR: [
            { memberId: query.memberId },
            { councilFellowshipId: member.councilFellowshipId },
          ]
        };
      }
    }
if(query.isFromSelamMinster){
  console.log("query.isFromSelamMinster", query.isFromSelamMinster);
  
  filters = {
    ...filters,
    isFromSelamMinster: query.isFromSelamMinster ==='true'?true:false
  }
}

    // RBAC scoping
    const isAdmin = Boolean((req as any).isAdminRole);
    const rbac = (req as any).rbac as { allowedFellowshipIds?: string[]; allowedCategoryIds?: string[] } | undefined;
    console.log('isAdmin:', isAdmin);
    console.log('rbac:', rbac);
    if (!isAdmin && rbac) {
      const fellowshipScope = rbac.allowedFellowshipIds && rbac.allowedFellowshipIds.length > 0 && !query.memberId
        ? { councilFellowshipId: { in: rbac.allowedFellowshipIds } }
        : {};
      // For member files, constrain by member category via nested relation
      const categoryScope = rbac.allowedCategoryIds && rbac.allowedCategoryIds.length > 0
        ? { member: { memberCategoryId: { in: rbac.allowedCategoryIds } } }
        : {};
      // For member files, also constrain by member's fellowship
      const fellowshipMemberScope = rbac.allowedFellowshipIds && rbac.allowedFellowshipIds.length > 0
        ? { member: { councilFellowshipId: { in: rbac.allowedFellowshipIds } } }
        : {};
      filters = { ...filters, ...fellowshipScope, ...categoryScope, ...fellowshipMemberScope } as IFilter;
    }

    req.filters = filters;
    console.log('File filters:', filters);
    next();
  }
);
