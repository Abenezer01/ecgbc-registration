import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { extractData } from "../lib/response-parser";

export interface FeeRuleData {
  id: string;
  name: string;
  memberTypeId?: string | null;
  memberCategoryId?: string | null;
  fellowshipIds?: string[];
  reportRequestId?: string | null;
  currency: string;
  amount: string;
  lateFeeMultiplier?: string | null;
  priority: number;
  isActive: boolean;
  memberType?: { id: string; value: string; description: string };
  memberCategory?: { id: string; value: string; description: string };
  fellowships?: { id: string; name: string }[];
  reportRequest?: { id: string; title: string };
  createdAt: string;
}

export function useFeeRules() {
  return useQuery<FeeRuleData[]>({
    queryKey: ["fee-rules"],
    queryFn: async () => {
      const res = await api.get(`/finance/fee-rules`);
      return (extractData(res) as any).rules || [];
    },
  });
}

export function useCreateFeeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<FeeRuleData>) => {
      const res = await api.post("/finance/fee-rules", payload);
      return extractData(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-rules"] });
    },
  });
}

export function useUpdateFeeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<FeeRuleData> & { id: string }) => {
      const res = await api.patch(`/finance/fee-rules/${id}`, payload);
      return extractData(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-rules"] });
    },
  });
}

export function useDeleteFeeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/finance/fee-rules/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-rules"] });
    },
  });
}

export function useGenerateMissingFees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reportRequestId: string) => {
      const res = await api.post(`/finance/fee-rules/generate-missing/${reportRequestId}`);
      return extractData(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-rules"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["finance-fees"] });
    },
  });
}
