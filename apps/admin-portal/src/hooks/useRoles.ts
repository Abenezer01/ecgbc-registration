import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { extractData, extractPaginatedData } from "@/lib/response-parser";

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await api.get("/role?_limit=100");
      const { data } = extractPaginatedData(res);
      return (data as any).roles as any[];
    },
    placeholderData: (prev) => prev,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await api.get("/permission");
      const { data } = extractPaginatedData(res);
      return (data as any).permissions as any[];
    },
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description: string; permissions: string[] }) => {
      const res = await api.post("/role", payload);
      return extractData(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const res = await api.patch(`/role/${id}`, payload);
      return extractData(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/role/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}
