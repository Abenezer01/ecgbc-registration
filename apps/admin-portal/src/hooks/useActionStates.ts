import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/useApi";
import { extractData, extractPaginatedData } from "../lib/response-parser";

export type ActionStateEntity = "MEMBER" | "FELLOWSHIP" | "PAYMENT" | "INVOICE";

export interface ActionStateRecord {
  id: string;
  entityType: string;
  entityId: string;
  state: string;
  note?: string | null;
  performedBy: string;
  performedAt: string;
  staff: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const ACTION_STATE_MACHINES: Record<ActionStateEntity, string[]> = {
  MEMBER:     ["REGISTERED", "CHECKED", "APPROVED"],
  FELLOWSHIP: ["REGISTERED", "CHECKED", "APPROVED"],
  PAYMENT:    ["PENDING", "VERIFIED", "CLEARED"],
  INVOICE:    ["ISSUED", "PAID", "RECONCILED"],
};

export const ACTION_STATE_COLORS: Record<string, string> = {
  REGISTERED: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
  CHECKED:    "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  APPROVED:   "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800",
  PENDING:    "text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700",
  VERIFIED:   "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  CLEARED:    "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800",
};

export function getNextState(entityType: ActionStateEntity, current: string): string | null {
  const states = ACTION_STATE_MACHINES[entityType] ?? [];
  const idx = states.indexOf(current);
  return idx >= 0 && idx < states.length - 1 ? states[idx + 1] : null;
}

export function useActionStates(entityType: ActionStateEntity, entityId: string) {
  const { get } = useApi();
  return useQuery({
    queryKey: ["action-states", entityType, entityId],
    queryFn: async () => {
      const res = await get(`/action-states?entityType=${entityType}&entityId=${entityId}&_limit=100`);
      const { data } = extractPaginatedData(res);
      return ((data as any).actionStates ?? []) as ActionStateRecord[];
    },
    enabled: !!entityId,
  });
}

export function useCreateActionState(entityType: ActionStateEntity, entityId: string) {
  const { post } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ state, note }: { state: string; note?: string }) => {
      const res = await post("/action-states", { entityType, entityId, state, note });
      const { data } = extractData(res);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-states", entityType, entityId] });
      // Also invalidate parent entity so currentActionState badge refreshes
      if (entityType === "MEMBER") queryClient.invalidateQueries({ queryKey: ["member", entityId] });
      if (entityType === "FELLOWSHIP") queryClient.invalidateQueries({ queryKey: ["fellowship", entityId] });
    },
  });
}
