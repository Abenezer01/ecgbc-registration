import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { extractData, extractPaginatedData } from "../lib/response-parser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeeStatusType {
  PENDING: "PENDING";
  SENT: "SENT";
  PAID: "PAID";
}

export interface ReportingFee {
  id: string;
  reportId: string;
  memberId: string;
  amount: string;
  currency: string;
  status: "PENDING" | "SENT" | "PAID";
  note?: string;
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    name: string;
    email?: string;
    memberCategory?: {
      id: string;
      value: string;
      description: string;
    };
  };
  report?: {
    id: string;
    year: number;
    crv?: string;
    bankReference?: string;
    status?: {
      id: string;
      value: string;
      description: string;
    };
  };
}

export interface FinanceSummary {
  currency: string;
  totalCollected: number;
  paidCount: number;
  pendingAmount: number;
  pendingCount: number;
  sentAmount: number;
  sentCount: number;
}

export interface CategoryFeeRate {
  id: string;
  categoryId: string;
  amount: string;
  currency: string;
  description?: string;
  category: {
    id: string;
    value: string;
    description: string;
  };
}

export interface PaymentMethodConfig {
  id?: string;
  isEnabled: boolean;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  phoneNumber?: string;
  instructions?: string;
}

export interface PaymentMethod {
  id: string;
  value: string;
  description: string;
  note: string;
  config: PaymentMethodConfig | null;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useFinanceSummary() {
  return useQuery<{ summaries: FinanceSummary[]; recentFees: ReportingFee[] }>({
    queryKey: ["finance-summary"],
    queryFn: async () => {
      const res = await api.get(`/finance/summary`);
      return extractData(res) as any;
    },
  });
}

export function useCategoryFeeRates() {
  return useQuery<CategoryFeeRate[]>({
    queryKey: ["finance-fee-rates"],
    queryFn: async () => {
      const res = await api.get(`/finance/fee-rates`);
      const data = extractData(res) as any;
      return data.rates || [];
    },
  });
}

export function useReportingFees(params: {
  page?: number;
  limit?: number;
  status?: string;
  memberId?: string;
}) {
  return useQuery<{ fees: ReportingFee[]; total: number }>({
    queryKey: ["finance-fees", params],
    queryFn: async () => {
      const res = await api.get(`/finance/fees`, {
        params: {
          _page: params.page || 1,
          _limit: params.limit || 20,
          status: params.status,
          memberId: params.memberId,
        },
      });
      const data = extractPaginatedData(res);
      return { fees: data.data.fees || [], total: data.meta?.total || 0 };
    },
  });
}

export function usePaymentMethods() {
  return useQuery<PaymentMethod[]>({
    queryKey: ["payment-methods-admin"],
    queryFn: async () => {
      const res = await api.get(`/finance/payment-methods`);
      return res.data.data.methods;
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useUpdatePaymentMethods() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (methodsToUpdate: { id: string; data: Partial<PaymentMethodConfig> }[]) => {
      return Promise.all(
        methodsToUpdate.map((m) => api.put(`/finance/payment-methods/${m.id}`, m.data))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods-admin"] });
    },
  });
}

export function useUpsertFeeRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      amount,
      currency,
      description,
    }: {
      categoryId: string;
      amount: number;
      currency?: string;
      description?: string;
    }) => {
      const res = await api.put(`/finance/fee-rates/${categoryId}`, {
        amount,
        currency,
        description,
      });
      return extractData(res) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-fee-rates"] });
    },
  });
}

export function useGenerateFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId }: { reportId: string }) => {
      const res = await api.post(`/finance/fees/generate`, { reportId });
      return extractData(res) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["finance-fees"] });
      // We also invalidate member-reports because generating a fee updates the report's included fee
      queryClient.invalidateQueries({ queryKey: ["member-reports"] });
    },
  });
}

export function useSendFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ feeId }: { feeId: string }) => {
      const res = await api.patch(`/finance/fees/${feeId}/send`);
      return extractData(res) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["finance-fees"] });
      queryClient.invalidateQueries({ queryKey: ["member-reports"] });
    },
  });
}

export function useMarkFeePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      feeId,
      note,
      crv,
    }: {
      feeId: string;
      note?: string;
      crv?: string;
    }) => {
      const res = await api.patch(`/finance/fees/${feeId}/pay`, { note, crv });
      return extractData(res) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["finance-fees"] });
      queryClient.invalidateQueries({ queryKey: ["member-reports"] });
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
      const res = await api.post(`/finance/verify`, { reference, suffix, phoneNumber });
      return extractData(res) as any;
    },
  });
}
