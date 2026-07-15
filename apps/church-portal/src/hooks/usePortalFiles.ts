import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface PortalFile {
  id: string;
  memberId: string;
  fileName: string;
  file: string;
  createdAt: string;
  fileType?: {
    id: string;
    description: string;
    value: string;
  } | null;
}

export function usePortalFiles() {
  return useQuery<PortalFile[]>({
    queryKey: ["portal-files"],
    queryFn: async () => {
      const res = await api.get(`/church-portal/files`);
      return res.data.data.files || [];
    },
  });
}
