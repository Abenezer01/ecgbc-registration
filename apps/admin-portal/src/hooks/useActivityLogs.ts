import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { extractPaginatedData } from "../lib/response-parser";

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  description?: string;
  metadata?: Record<string, any> | null;
  performedBy?: string;
  performedByType?: "STAFF" | "CHURCH_USER";
  performerName?: string;
  performerEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface LogsResponse {
  logs: ActivityLog[];
  total: number;
}

export function useActivityLogs(params: {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery<LogsResponse>({
    queryKey: ["activity-logs", params],
    queryFn: async () => {
      const res = await api.get("/logs", {
        params: {
          _page: params.page || 1,
          _limit: params.limit || 20,
          search: params.search || undefined,
          action: params.action || undefined,
          entity: params.entity || undefined,
          entityId: params.entityId || undefined,
          startDate: params.startDate || undefined,
          endDate: params.endDate || undefined,
        },
      });
      const { data, meta } = extractPaginatedData(res);
      return {
        logs: (data as any).logs || [],
        total: meta?.total || ((data as any).logs || []).length,
      };
    },
  });
}
