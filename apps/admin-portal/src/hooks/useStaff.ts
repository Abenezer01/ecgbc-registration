import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { buildQueryString } from "@/lib/query-builder";
import { extractData, extractPaginatedData } from "@/lib/response-parser";

export interface StaffFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export function useStaffList(filters: StaffFilters = {}) {
  return useQuery({
    queryKey: ["staff", filters],
    queryFn: async () => {
      const qs = buildQueryString({
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
        search: filters.search || undefined,
      });
      const res = await api.get(`/staff${qs}`);
      const { data, meta } = extractPaginatedData(res);
      return {
        staff: (data as any).staffs as any[],
        total: meta?.total ?? 0,
      };
    },
    placeholderData: (prev) => prev,
  });
}

export function useStaffDetail(id: string) {
  return useQuery({
    queryKey: ["staff", id],
    queryFn: async () => {
      const res = await api.get(`/staff/${id}`);
      const data = extractData(res);
      return (data as any).staff;
    },
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/staff", payload);
      return extractData(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const res = await api.patch(`/staff/${id}`, payload);
      return extractData(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/staff/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

// Fellowship assignment hooks
export function useStaffFellowships(staffId: string) {
  return useQuery({
    queryKey: ["staff", staffId, "fellowships"],
    queryFn: async () => {
      const res = await api.get(`/staff/${staffId}/fellowships`);
      const data = extractData(res);
      return {
        staff: (data as any).staff,
        fellowships: (data as any).fellowships as any[],
      };
    },
    enabled: !!staffId,
  });
}

export function useAssignFellowships() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, fellowshipIds }: { staffId: string; fellowshipIds: string[] }) => {
      const res = await api.post(`/staff/${staffId}/fellowships`, { fellowshipIds });
      return extractData(res);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["staff", variables.staffId, "fellowships"] });
      qc.invalidateQueries({ queryKey: ["staff", variables.staffId] });
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useUpdateFellowships() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, fellowshipIds }: { staffId: string; fellowshipIds: string[] }) => {
      const res = await api.patch(`/staff/${staffId}/fellowships`, { fellowshipIds });
      return extractData(res);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["staff", variables.staffId, "fellowships"] });
      qc.invalidateQueries({ queryKey: ["staff", variables.staffId] });
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useRemoveFellowship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, fellowshipId }: { staffId: string; fellowshipId: string }) => {
      await api.delete(`/staff/${staffId}/fellowships/${fellowshipId}`);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["staff", variables.staffId, "fellowships"] });
      qc.invalidateQueries({ queryKey: ["staff", variables.staffId] });
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}
