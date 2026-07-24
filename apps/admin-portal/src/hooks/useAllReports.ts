import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { extractPaginatedData } from "../lib/response-parser";

export interface GlobalReport {
  id: string;
  year: number;
  crv?: string;
  bankReference?:string;
  remark?: string;
  file?: string;
  reportedAt: string;
  status?: {
    value: string;
    description: string;
  };
  member?: {
    id: string;
    name: string;
    email: string;
  };
  reportingFee?: {
    id: string;
    amount: string;
    currency: string;
    status: string;
    crv?: string;
  };
}

export function useAllReports(page = 1, limit = 50) {
  return useQuery<{ reports: GlobalReport[]; total: number }>({
    queryKey: ["all-reports", page, limit],
    queryFn: async () => {
      const res = await api.get(`/reports`, {
        params: {
          _page: page,
          _limit: limit,
        },
      });
      const { data, meta } = extractPaginatedData(res);
      return { reports: (data as any).reports || [], total: meta?.total ?? 0 };
    },
  });
}
