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

export interface ReportSummaryData {
  totalRequests: number;
  activeRequests: number;
  totalSubmissions: number;
  feesCollected: number;
  totalMembers: number;
  recentSubmissions: {
    id: string;
    createdAt: string;
    year: number;
    member: { id: string; name: string } | null;
    status: { value: string };
    reportingFee?: { status: string } | null;
  }[];
  submissionsByStatus: {
    status: string;
    count: number;
  }[];
  submissionsByFellowship: {
    fellowship: string;
    reported: number;
    notReported: number;
    total: number;
  }[];
}

export function useReportSummary() {
  return useQuery<ReportSummaryData>({
    queryKey: ["reports-summary"],
    queryFn: async () => {
      const res = await api.get(`/reports/summary`);
      // We know response parsing wraps data, but extractPaginatedData is for pagination.
      // Since it's a simple response, we can access res.data.data.summary.
      return res.data.data.summary as ReportSummaryData;
    },
  });
}
