import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/useApi";
import { buildQueryString } from "@/lib/query-builder";
import { extractPaginatedData } from "@/lib/response-parser";
import type { MembersFilters } from "./useMembers";

export interface TypeCount {
  id: string;
  description: string;
  count: number;
}

export interface MemberStats {
  total: number;
  inEthiopia: number;
  abroad: number;
  inactive: number;
  byType: TypeCount[];
}

/** Mirrors useMembers query-string logic with arbitrary overrides */
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

export interface MemberTypeOption {
  id: string;
  description: string;
}

export function useMemberStats(
  filters: MembersFilters,
  memberTypeOptions: MemberTypeOption[] = []
) {
  const { get } = useApi();

  return useQuery<MemberStats>({
    queryKey: ["member-stats", filters, memberTypeOptions.map((t) => t.id)],
    queryFn: async () => {
      const getCount = (qs: string) =>
        get(`/members${qs}`).then((res) => {
          const { meta } = extractPaginatedData(res);
          return meta?.total ?? 0;
        });

      // Base counts + per-type counts in one parallel batch
      const [total, inEthiopia, abroad, inactive, ...typeCounts] =
        await Promise.all([
          getCount(buildFilterQS(filters, { isInEthiopia: "all" })),
          getCount(buildFilterQS(filters, { isInEthiopia: "yes" })),
          getCount(buildFilterQS(filters, { isInEthiopia: "no" })),
          get("/members/inactive/all?_page=1&_limit=1")
            .then(
              (res) =>
                (res as any)?.data?.meta?.total ??
                (res as any)?.data?.data?.total ??
                0
            )
            .catch(() => 0),
          // One count query per institution type, overriding typeId
          ...memberTypeOptions.map((t) =>
            getCount(buildFilterQS(filters, { typeId: t.id }))
          ),
        ]);

      const byType: TypeCount[] = memberTypeOptions.map((t, i) => ({
        id: t.id,
        description: t.description,
        count: typeCounts[i] ?? 0,
      }));

      return { total, inEthiopia, abroad, inactive, byType };
    },
    enabled: memberTypeOptions.length > 0,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}
