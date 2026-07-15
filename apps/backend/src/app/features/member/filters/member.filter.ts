import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../config/error.config";
import { GetMembersQueryParams } from "../interfaces/query-params.interface";
import { IFilter } from "../../../shared/interfaces/filter.interface";

export const getMembers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetMembersQueryParams;
    let filters: IFilter = { isActive: true };

    for (const key in query) {
      if (["stateId", "typeId", "regionId"].includes(key)) {
        //@ts-ignore
        const value = query[key];
        filters = { ...filters, [key]: value };
      }
    }
    if (query.isInEthiopia) {
      const isInEthiopia = query.isInEthiopia === "yes";
      filters = { ...filters, isInEthiopia };
    }
    if (query._search) {
      filters = {
        ...filters,
        OR: [
          { name: { contains: query._search } },
          { certificateNo: { contains: query._search } },
          { city: { contains: query._search } },
        ],
      };
    }
    if (query.memberTypeChanged && query.memberTypeChanged !== "all") {
      filters = {
        ...filters,
        typeChangedAt: query.memberTypeChanged === "changed" ? { not: null } : null,
      } as IFilter;
    }

    // RBAC scoping for active-only users and fellowship restrictions
    const isAdmin = Boolean((req as any).isAdminRole);
    const rbac = (req as any).rbac as { allowedFellowshipIds?: string[]; allowedCategoryIds?: string[]; activeOnly?: boolean } | undefined;
    
    // Apply fellowship filtering
    if (query.councilFellowshipId && query.councilFellowshipId !== "all") {
      if (!isAdmin) {
        const allowed = rbac?.allowedFellowshipIds || [];
        if (!allowed.includes(query.councilFellowshipId)) {
          filters = { ...filters, id: { in: [] } } as IFilter;
        } else {
          filters = { ...filters, councilFellowshipId: query.councilFellowshipId } as IFilter;
        }
      } else {
        filters = { ...filters, councilFellowshipId: query.councilFellowshipId } as IFilter;
      }
    } else {
      // No specific fellowship requested (or "all")
      if (!isAdmin) {
        const allowed = rbac?.allowedFellowshipIds || [];
        if (allowed && allowed.length > 0) {
          filters = { ...filters, councilFellowshipId: { in: allowed } } as IFilter;
        }
      }
    }

    if (!isAdmin && rbac) {
      // Apply active-only filter if needed
      if (rbac.activeOnly) {
        filters = { ...filters, isActive: true } as IFilter;
      }
    }

    if (query.filterByReport && query.reportYear) {
      let reportFilter: any = {
        year: Number(query.reportYear),
        statusId: query.reportStatus,
      };
      if (!isAdmin && rbac && rbac.allowedFellowshipIds?.length) {
        reportFilter = {
          AND: [
            reportFilter,
            {
              OR: [
                { councilFellowshipId: { in: rbac.allowedFellowshipIds } },
                { member: { councilFellowshipId: { in: rbac.allowedFellowshipIds } } },
              ],
            },
          ],
        };
      }
      filters = {
        ...filters,
        reports: {
          some: reportFilter,
        },
      } as IFilter;
    }

    req.filters = filters;
    next();
  }
);
