import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { extractData, extractPaginatedData } from "../lib/response-parser";

export interface MemberFile {
  id: string;
  memberId: string;
  fileName: string;
  file: string; // File path/name returned by server
  isFromSelamMinster: boolean;
  createdAt: string;
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
      fileTypeId 
    }: { 
      memberId: string; 
      files: File[]; 
      isFromSelamMinster?: boolean;
      fileTypeId?: string;
    }) => {
      const formData = new FormData();
      formData.append("member", memberId);
      if (isFromSelamMinster) {
        formData.append("isFromSelamMinster", "true");
      }
      if (fileTypeId) {
        formData.append("fileTypeId", fileTypeId);
      }
      files.forEach((file) => {
        formData.append("memberFiles", file);
      });

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
