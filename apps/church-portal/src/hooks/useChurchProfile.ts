import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface ChurchProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  region?: string;
}

export function useChurchProfile() {
  return useQuery<ChurchProfile>({
    queryKey: ["church-profile"],
    queryFn: async () => {
      const res = await api.get(`/church-portal/profile`);
      return res.data.data.profile;
    },
  });
}
