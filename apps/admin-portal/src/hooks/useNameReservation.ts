import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/useApi";
import { useToast } from "@/components/ui/Toast";

export interface NameCheckMatch {
  entityId: string;
  entityType: string;
  nameAm: string;
  nameEn: string;
  isActive: boolean;
  score: number;
  flags: string[];
}

export interface NameReservation {
  id: string;
  requestedNameAm: string;
  requestedNameEn: string | null;
  status: string;
  similarityData: string | null;
  requestedBy: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  requester?: { id: string; firstName: string; lastName: string };
  reviewer?: { id: string; firstName: string; lastName: string };
}

export function useNameReservation() {
  const api = useApi();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const checkNameMutation = useMutation({
    mutationFn: async (data: { nameAm: string; nameEn?: string }) => {
      const response = await api.post("/name-reservations/check", data);
      return (response.data as any).data.matches as NameCheckMatch[];
    },
    onError: (error: any) => {
      addToast({
        title: "Name Check Failed",
        description: error.response?.data?.message || error.message,
        variant: "error",
      });
    },
  });

  const createReservationMutation = useMutation({
    mutationFn: async (data: { nameAm: string; nameEn?: string }) => {
      const response = await api.post("/name-reservations", data);
      return (response.data as any).data.reservation as NameReservation;
    },
    onSuccess: () => {
      addToast({
        title: "Success",
        description: "Name reservation created.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["name-reservations"] });
    },
    onError: (error: any) => {
      addToast({
        title: "Failed",
        description: error.response?.data?.message || error.message,
        variant: "error",
      });
    },
  });

  const useReservations = () => {
    return useQuery({
      queryKey: ["name-reservations"],
      queryFn: async () => {
        const response = await api.get("/name-reservations");
        return (response.data as any).data.reservations as NameReservation[];
      },
    });
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/name-reservations/${id}/status`, { status });
      return (response.data as any).data.reservation;
    },
    onSuccess: () => {
      addToast({
        title: "Success",
        description: "Reservation status updated.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["name-reservations"] });
    },
    onError: (error: any) => {
      addToast({
        title: "Failed",
        description: error.response?.data?.message || error.message,
        variant: "error",
      });
    },
  });

  return {
    checkName: checkNameMutation.mutateAsync,
    isChecking: checkNameMutation.isPending,
    createReservation: createReservationMutation.mutateAsync,
    isCreating: createReservationMutation.isPending,
    useReservations,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}
