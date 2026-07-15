import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { extractData, extractPaginatedData } from "../lib/response-parser";

export interface ReportRequestData {
  id: string;
  title: string;
  description?: string;
  year: number;
  dueDate: string;
  feeMode?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    reports: number;
  };
}

export function useReportRequests(page = 1, limit = 20) {
  return useQuery<{ requests: ReportRequestData[]; total: number }>({
    queryKey: ["report-requests", page, limit],
    queryFn: async () => {
      const res = await api.get("/report-requests", {
        params: { _page: page, _limit: limit },
      });
      const { data, meta } = extractPaginatedData(res);
      return { requests: (data as any).requests || [], total: meta.total };
    },
  });
}

export function useCreateReportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ReportRequestData>) => {
      const res = await api.post("/report-requests", payload);
      return extractData(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-requests"] });
    },
  });
}

export function useUpdateReportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<ReportRequestData> & { id: string }) => {
      const res = await api.patch(`/report-requests/${id}`, payload);
      return extractData(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-requests"] });
    },
  });
}

export function useDeleteReportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/report-requests/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-requests"] });
    },
  });
}
