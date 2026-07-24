import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/useApi";
import { buildQueryString } from "@/lib/query-builder";
import { extractPaginatedData } from "@/lib/response-parser";
import type { MembersFilters } from "./useMembers";

export interface MemberStats {
  total: number;
  inEthiopia: number;
  abroad: number;
  inactive: number;
}

/** Mirrors useMembers query-string logic, minus pagination & isInEthiopia (overridden per card) */
function buildFilterQS(
  filters: MembersFilters,
  overrides: Partial<MembersFilters> = {}
) {
  const f = { ...filters, ...overrides };
  return buildQueryString({
    page: 1,
    limit: 1,
    search: f.search,
    filters: {
      councilFellowshipId:
        (f.councilFellowshipId || f.fellowshipId) !== "all"
          ? f.councilFellowshipId || f.fellowshipId
          : undefined,
      typeId: f.typeId !== "all" ? f.typeId : undefined,
      stateId: f.stateId !== "all" ? f.stateId : undefined,
      regionId: f.regionId !== "all" ? f.regionId : undefined,
      isInEthiopia: f.isInEthiopia !== "all" ? f.isInEthiopia : undefined,
      memberTypeChanged:
        f.memberTypeChanged !== "all" ? f.memberTypeChanged : undefined,
      filterByReport: f.filterByReport || undefined,
      reportStatus: f.reportStatus !== "all" ? f.reportStatus : undefined,
      reportYear: f.filterByReport ? f.reportYear : undefined,
    },
  });
}

export function useMemberStats(filters: MembersFilters) {
  const { get } = useApi();

  return useQuery<MemberStats>({
    queryKey: ["member-stats", filters],
    queryFn: async () => {
      const getCount = (qs: string) =>
        get(`/members${qs}`).then((res) => {
          const { meta } = extractPaginatedData(res);
          return meta?.total ?? 0;
        });

      const [total, inEthiopia, abroad, inactive] = await Promise.all([
        // total: no isInEthiopia override — matches current filter set
        getCount(buildFilterQS(filters, { isInEthiopia: "all" })),
        // in ethiopia
        getCount(buildFilterQS(filters, { isInEthiopia: "yes" })),
        // abroad
        getCount(buildFilterQS(filters, { isInEthiopia: "no" })),
        // inactive: uses the backend's inactive endpoint with limit=1 for a count
        get("/members/inactive/all?_page=1&_limit=1")
          .then((res) => (res as any)?.data?.meta?.total ?? (res as any)?.data?.data?.total ?? 0)
          .catch(() => 0),
      ]);

      return { total, inEthiopia, abroad, inactive };
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}
