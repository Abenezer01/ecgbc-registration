import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { extractData, extractPaginatedData } from "../lib/response-parser";

export interface Report {
  id: string;
  year: number;
  crv?: string;
  remark?: string;
  file?: string;
  reportedAt: string;
  bankReference?: string;
  status?: {
    value: string;
    description: string;
  };
}

export function useMemberReports(memberId: string) {
  return useQuery<Report[]>({
    queryKey: ["member-reports", memberId],
    queryFn: async () => {
      const res = await api.get(`/reports`, {
        params: {
          memberId,
          _limit: 100,
        },
      });
      const { data } = extractPaginatedData(res);
      return (data as any).reports || [];
    },
    enabled: !!memberId,
  });
}

export function useCreateMemberReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberId,
      year,
      crv,
      reportedAt,
      remark,
      bankReference,
      report,
      reportRequestId,
    }: {
      memberId: string;
      year: number;
      crv?: string;
      reportedAt?: string;
      remark?: string;
      bankReference?: string;
      bankSuffix?: string;
      report?: File;
      reportRequestId?: string;
    }) => {
      const formData = new FormData();
      formData.append("member", memberId);
      formData.append("year", String(year));

      const reportDate = reportedAt ? new Date(reportedAt) : new Date();
      const dateYear = reportDate.getFullYear();
      const month = String(reportDate.getMonth() + 1).padStart(2, '0');
      const day = String(reportDate.getDate()).padStart(2, '0');
      const formattedDate = `${dateYear}-${month}-${day}T00:00:00Z`;
      formData.append("reportedAt", formattedDate);

      if (crv) formData.append("crv", crv);
      if (remark) formData.append("remark", remark);
      if (bankReference) formData.append("bankReference", bankReference);
      if (bankSuffix) formData.append("bankSuffix", bankSuffix);
      if (report) formData.append("report", report);
      if (reportRequestId) formData.append("reportRequestId", reportRequestId);

      const res = await api.post(`/reports/member`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = extractData(res);
      return (data as any).report;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["member-reports", variables.memberId] });
    },
  });
}

export function useUpdateMemberReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reportId,
      memberId,
      crv,
      reportedAt,
      remark,
      bankReference,
      report,
    }: {
      reportId: string;
      memberId: string;
      crv?: string;
      reportedAt?: string;
      remark?: string;
      bankReference?: string;
      bankSuffix?: string;
      report?: File;
    }) => {
      const formData = new FormData();
      formData.append("reportId", reportId);

      const reportDate = reportedAt ? new Date(reportedAt) : new Date();
      const dateYear = reportDate.getFullYear();
      const month = String(reportDate.getMonth() + 1).padStart(2, '0');
      const day = String(reportDate.getDate()).padStart(2, '0');
      const formattedDate = `${dateYear}-${month}-${day}T00:00:00Z`;
      formData.append("reportedAt", formattedDate);

      if (crv) formData.append("crv", crv);
      if (remark) formData.append("remark", remark);
      if (bankReference) formData.append("bankReference", bankReference);
      if (bankSuffix) formData.append("bankSuffix", bankSuffix);
      if (report) formData.append("report", report);

      const res = await api.patch(`/reports/member`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = extractData(res);
      return (data as any).report;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["member-reports", variables.memberId] });
    },
  });
}

export function useDeleteMemberReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId }: { reportId: string; memberId: string }) => {
      await api.delete(`/reports/member/${reportId}`);
      return reportId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["member-reports", variables.memberId] });
    },
  });
}