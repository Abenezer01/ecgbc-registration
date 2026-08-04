import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { extractData, extractPaginatedData } from "../lib/response-parser";

export interface MemberFile {
  id: string;
  memberId: string;
  fileName: string;
  file: string;
  isFromSelamMinster: boolean;
  createdAt: string;
  categoryId?: string | null;
  /** Populated when the backend includes the category relation */
  category?: {
    id: string;
    description: string;
    value: string;
    note?: string;
  } | null;
  /** Legacy alias used in some older code paths */
  fileType?: {
    id: string;
    description: string;
    value: string;
  } | null;
}

export function useMemberFiles({ memberId, isFromSelamMinster = false }: { memberId: string; isFromSelamMinster?: boolean }) {
  return useQuery<MemberFile[]>({
    queryKey: ["member-files", memberId, isFromSelamMinster],
    queryFn: async () => {
      const res = await api.get(`/files`, {
        params: {
          memberId,
          isFromSelamMinster: String(isFromSelamMinster),
          _limit: 100,
        },
      });
      const { data } = extractPaginatedData(res);
      return (data as any).files || [];
    },
    enabled: !!memberId,
  });
}

export function useUploadMemberFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberId,
      files,
      isFromSelamMinster = false,
      fileTypeId,
      fileCategoryIds,
    }: {
      memberId: string;
      files: File[];
      isFromSelamMinster?: boolean;
      /** Single category applied to all files (legacy) */
      fileTypeId?: string;
      /** Per-file category IDs — index-aligned with `files` array */
      fileCategoryIds?: string[];
    }) => {
      const formData = new FormData();
      formData.append("member", memberId);
      if (isFromSelamMinster) formData.append("isFromSelamMinster", "true");

      // Per-file categories take priority; fall back to a single fileTypeId for all
      if (fileCategoryIds && fileCategoryIds.length > 0) {
        formData.append("fileCategoryIds", JSON.stringify(fileCategoryIds));
      } else if (fileTypeId) {
        // replicate as an array matching the files
        const ids = files.map(() => fileTypeId);
        formData.append("fileCategoryIds", JSON.stringify(ids));
      }

      files.forEach((file) => formData.append("memberFiles", file));

      const res = await api.post(`/files/member/bulk-upload`, formData);
      const data = extractData(res);
      return (data as any).files;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["member-files", variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ["document-completeness", variables.memberId] });
    },
  });
}

export function useUpdateMemberFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fileId,
      memberId,
      fileName,
      categoryId,
      newFile,
    }: {
      fileId: string;
      memberId: string;
      fileName?: string;
      categoryId?: string | null;
      /** Optional replacement file binary */
      newFile?: File | null;
    }) => {
      // Always use FormData so we can optionally attach a file
      const formData = new FormData();
      if (fileName   !== undefined) formData.append("fileName",   fileName);
      if (categoryId !== undefined) formData.append("categoryId", categoryId ?? "");
      if (newFile)                  formData.append("file",        newFile);

      const res = await api.patch(`/files/${fileId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = extractData(res);
      return (data as any).file;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["member-files", variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ["document-completeness", variables.memberId] });
    },
  });
}

export function useDeleteMemberFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fileId }: { fileId: string; memberId: string }) => {
      const res = await api.delete(`/files/${fileId}`);
      return extractData(res);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["member-files", variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ["document-completeness", variables.memberId] });
    },
  });
}
