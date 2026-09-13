import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface ClosureRequestItem {
  id: string;
  memberId: string;
  closureType: "DISSOLUTION" | "LOW_MEMBERSHIP" | "FINANCIAL_HARDSHIP" | "LEADERSHIP_VACANCY" | "EXTERNAL_AMALGAMATION" | "OTHER";
  reason: string;
  resolutionDate?: string | null;
  effectiveDate: string;
  contactPersonName?: string | null;
  contactPersonPhone?: string | null;
  contactPersonEmail?: string | null;
  recordsLocation?: string | null;
  resolutionDocumentUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  submittedByType: "CHURCH_USER" | "STAFF";
  submittedById?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewRemarks?: string | null;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    name: string;
    nameEn?: string;
    certificateNo: string;
    city?: string;
    subcity?: string;
    isActive: boolean;
    currentActionState?: string;
    councilFellowship?: { id: string; name: string };
    region?: { id: string; description: string; value: string };
  };
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface ClosureRequestsResponse {
  requests: ClosureRequestItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubmitClosurePayload {
  memberId: string;
  closureType: "DISSOLUTION" | "LOW_MEMBERSHIP" | "FINANCIAL_HARDSHIP" | "LEADERSHIP_VACANCY" | "EXTERNAL_AMALGAMATION" | "OTHER";
  reason: string;
  resolutionDate?: string;
  effectiveDate?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  recordsLocation?: string;
  resolutionDocumentUrl?: string;
}

export function useClosureRequests(params?: { status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery<ClosureRequestsResponse>({
    queryKey: ["closureRequests", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.status && params.status !== "all") queryParams.append("status", params.status);
      if (params?.search) queryParams.append("search", params.search);
      if (params?.page) queryParams.append("page", String(params.page));
      if (params?.limit) queryParams.append("limit", String(params.limit));

      const res = await api.get(`/members/closure-requests/all?${queryParams.toString()}`);
      return res.data.data;
    },
  });
}

export function useMemberClosureRequests(memberId: string | null) {
  return useQuery<ClosureRequestItem[]>({
    queryKey: ["memberClosureRequests", memberId],
    queryFn: async () => {
      const res = await api.get(`/members/${memberId}/closure-requests`);
      return res.data.data;
    },
    enabled: !!memberId,
  });
}

export function useSubmitClosureRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitClosurePayload) => {
      const { memberId, ...body } = payload;
      const res = await api.post(`/members/${memberId}/closure-request`, body);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["memberClosureRequests", variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ["closureRequests"] });
      queryClient.invalidateQueries({ queryKey: ["member", variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useApproveClosureRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reviewRemarks }: { requestId: string; reviewRemarks?: string }) => {
      const res = await api.post(`/members/closure-requests/${requestId}/approve`, { reviewRemarks });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberClosureRequests"] });
      queryClient.invalidateQueries({ queryKey: ["closureRequests"] });
      queryClient.invalidateQueries({ queryKey: ["member"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["activityLogs"] });
    },
  });
}

export function useRejectClosureRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reviewRemarks }: { requestId: string; reviewRemarks: string }) => {
      const res = await api.post(`/members/closure-requests/${requestId}/reject`, { reviewRemarks });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberClosureRequests"] });
      queryClient.invalidateQueries({ queryKey: ["closureRequests"] });
    },
  });
}
