import { useMutation } from "@tanstack/react-query";
import api from "../lib/api";
import { useToast } from "@/components/ui/Toast";

export function useDeleteMember() {
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/members/${id}`);
    },
    onSuccess: () => {
      addToast({ variant: "success", title: "Deleted", description: "Member deleted successfully." });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message ?? "Failed to delete member";
      addToast({ variant: "destructive", title: "Error", description: msg });
    },
  });
}