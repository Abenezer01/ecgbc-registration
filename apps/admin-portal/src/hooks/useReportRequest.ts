import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export function useReportRequest(id?: string) {
  return useQuery({
    queryKey: ["report-request", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/report-requests/${id}`);
      // response shape: { data: { request, reported, notReported } }
      return res.data.data;
    },
    enabled: !!id,
  });
}
