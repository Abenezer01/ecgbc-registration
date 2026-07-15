import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Report {
  id: string;
  year: number;
  crv?: string;
  remark?: string;
  file?: string;
  reportedAt: string;
  reportRequestId?: string;
  status?: {
    value: string;
    description: string;
  };
  reportingFee?: {
    id: string;
    amount: string;
    currency: string;
    status: "PENDING" | "SENT" | "PAID";
  };
}

export interface PortalReportRequest {
  id: string;
  title: string;
  description?: string;
  year: number;
  dueDate: string;
  isActive: boolean;
  reports: { id: string }[];
}

export function usePortalReports() {
  return useQuery<Report[]>({
    queryKey: ["portal-reports"],
    queryFn: async () => {
      const res = await api.get(`/church-portal/reports`);
      return res.data.data.reports || [];
    },
  });
}

export function useFeePreview(reportRequestId?: string) {
  return useQuery({
    queryKey: ["fee-preview", reportRequestId],
    queryFn: async () => {
      const res = await api.get(`/church-portal/fee-preview`, {
        params: { reportRequestId },
      });
      return res.data.data.preview;
    },
    enabled: true, // we want to fetch the global fee if no request is linked
  });
}

export function usePortalReportRequests() {
  return useQuery<PortalReportRequest[]>({
    queryKey: ["portal-report-requests"],
    queryFn: async () => {
      const res = await api.get(`/church-portal/report-requests`);
      return res.data.data.requests || [];
    },
  });
}

export function useCreatePortalReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      year,
      crv,
      reportedAt,
      remark,
      report,
      reportRequestId,
    }: {
      year: number;
      crv?: string;
      reportedAt?: string;
      remark?: string;
      report?: File;
      reportRequestId?: string;
    }) => {
      const formData = new FormData();
      formData.append("year", String(year));
      
      const reportDate = reportedAt ? new Date(reportedAt) : new Date();
      const dateYear = reportDate.getFullYear();
      const month = String(reportDate.getMonth() + 1).padStart(2, '0');
      const day = String(reportDate.getDate()).padStart(2, '0');
      const formattedDate = `${dateYear}-${month}-${day}T00:00:00Z`;
      formData.append("reportedAt", formattedDate);

      if (crv) formData.append("crv", crv);
      if (remark) formData.append("remark", remark);
      if (report) formData.append("report", report);
      if (reportRequestId) formData.append("reportRequestId", reportRequestId);

      const res = await api.post(`/church-portal/reports`, formData);
      return res.data.data.report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-reports"] });
    },
  });
}

export function useSubmitReportPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reportId,
      crv,
    }: {
      reportId: string;
      crv: string;
    }) => {
      const res = await api.patch(`/church-portal/reports/${reportId}/payment`, { crv });
      return res.data.data.report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-reports"] });
    },
  });
}

export interface PaymentMethod {
  id: string;
  value: string;
  description: string;
  note: string;
  config: {
    isEnabled: boolean;
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    phoneNumber?: string;
    instructions?: string;
  } | null;
}

export function usePaymentMethods() {
  return useQuery<PaymentMethod[]>({
    queryKey: ["church-payment-methods"],
    queryFn: async () => {
      const res = await api.get(`/church-portal/payment-methods`);
      return res.data.data.methods || [];
    },
  });
}

export function useVerifyPayment() {
  return useMutation({
    mutationFn: async ({
      reference,
      suffix,
      phoneNumber,
    }: {
      reference: string;
      suffix?: string;
      phoneNumber?: string;
    }) => {
      const res = await api.post(`/church-portal/verify`, { reference, suffix, phoneNumber });
      return res.data.data.verification;
    },
  });
}
