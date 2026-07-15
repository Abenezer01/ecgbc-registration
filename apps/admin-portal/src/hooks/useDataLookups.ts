import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/useApi";
import { extractData, extractPaginatedData } from "../lib/response-parser";

export interface DataLookup {
  id: string;
  type: string;
  category?: string;
  value: string;
  description: string;
  documentRequirement?: {
    id: string;
    fileTypeId: string;
    appliesTo: string;
    isRequired: boolean;
    note?: string | null;
  } | null;
}

function isFileCategoryPayload(payload: Partial<DataLookup> & { type?: string; category?: string }) {
  const type = (payload.type || "").toLowerCase();
  const category = (payload.category || "").toLowerCase();
  return ["file_type", "file type", "document type"].includes(type) || ["file_type", "file type", "document type"].includes(category);
}

export function useDataLookups(params?: { type?: string; category?: string; [key: string]: any }) {
  const { get } = useApi();

  return useQuery<DataLookup[]>({
    queryKey: ["data-lookups", params],
    queryFn: async () => {
      const res = await get("/data-lookups", { params });
      const { data } = extractPaginatedData(res);
      return (data as any).lookups || data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useCreateDataLookup() {
  const { post } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<DataLookup, "id">) => {
      const res = await post("/data-lookups", payload);
      const data = extractData(res);
      return (data as any).lookup || data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-lookups"] });
      queryClient.invalidateQueries({ queryKey: ["document-types"] });
      queryClient.invalidateQueries({ queryKey: ["document-completeness"] });
    },
  });
}

export function useUpdateDataLookup() {
  const { patch } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<DataLookup> & { id: string }) => {
      const res = await patch(`/data-lookups/${id}`, payload);
      const data = extractData(res);
      return (data as any).lookup || data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-lookups"] });
      queryClient.invalidateQueries({ queryKey: ["document-types"] });
      queryClient.invalidateQueries({ queryKey: ["document-completeness"] });
    },
  });
}

export function useUpdateDocumentRequirement() {
  const { post } = useApi(); // assuming we will create a POST endpoint; for now we mock
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileTypeId,
      isRequired,
      note,
      appliesTo = "member",
    }: {
      fileTypeId: string;
      isRequired: boolean;
      note?: string;
      appliesTo?: string;
    }) => {
      // TODO: Implement backend endpoint for document requirements
      // For now, return a mock response to prevent 404 errors
      // In the future, replace with actual API call:
      // const res = await post("/document-requirements", { fileTypeId, isRequired, note, appliesTo });
      // return extractData(res);
      return {
        fileTypeId,
        isRequired,
        note,
        appliesTo,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-lookups"] });
      queryClient.invalidateQueries({ queryKey: ["document-types"] });
      queryClient.invalidateQueries({ queryKey: ["document-completeness"] });
    },
  });
}

export function useDeleteDataLookup() {
  const { delete: deleteMethod } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await deleteMethod(`/data-lookups/${id}`);
      return extractData(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-lookups"] });
      queryClient.invalidateQueries({ queryKey: ["document-types"] });
      queryClient.invalidateQueries({ queryKey: ["document-completeness"] });
    },
  });
}