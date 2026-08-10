import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { buildQueryString } from "../lib/query-builder";
import { extractPaginatedData, extractData } from "../lib/response-parser";

export interface Fellowship {
  id: string;
  name: string;
  certificateNo?: string;
  region?: { id: string; name: string };
  regionId?: string;
  city?: string;
  isInEthiopia?: boolean;
  isActive: boolean;
  _count?: { members: number };
  contactPerson?: {
    fullName: string;
    phoneNumber: string;
    email?: string;
  };
}

export interface FellowshipsFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  regionId?: string;
  isActive?: string;
  sortBy?: string;
  sortDirection?: string;
}

export function useFellowships(params: FellowshipsFilters = {}) {
  const queryString = buildQueryString({
    page: params.page,
    limit: params.pageSize ?? params.limit ?? 20,
    search: params.search,
    filters: {
      regionId: params.regionId !== "all" ? params.regionId : undefined,
      isActive: params.isActive !== "all" ? params.isActive : undefined,
      _sort: params.sortBy,
      _order: params.sortDirection,
    },
  });

  return useQuery<{ fellowships: Fellowship[]; total: number }>({
    queryKey: ["fellowships", params],
    queryFn: async () => {
      const res = await api.get(`/council-fellowship-list${queryString}`);
      const { data, meta } = extractPaginatedData(res);
      return {
        fellowships: (data as any).fellowships,
        total: meta?.total || 0,
      };
    },
  });
}

export function useFellowship(id: string) {
  return useQuery<Fellowship>({
    queryKey: ["fellowship", id],
    queryFn: async () => {
      const res = await api.get(`/council-fellowship/${id}`);
      const data = extractData(res);
      return (data as any).fellowship as Fellowship;
    },
    enabled: !!id,
  });
}
