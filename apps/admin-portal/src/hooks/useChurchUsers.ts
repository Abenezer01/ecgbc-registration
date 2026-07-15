import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { extractData, extractPaginatedData } from "@/lib/response-parser";

export interface ChurchUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  isActive: boolean;
  memberId: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    name: string;
    certificateNo: string;
  };
}

export interface ChurchUsersFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  memberId?: string;
}

export interface ChurchUsersResponse {
  churchUsers: ChurchUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateChurchUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: "ADMIN" | "EDITOR" | "VIEWER";
  memberId: string;
}

export interface UpdateChurchUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: "ADMIN" | "EDITOR" | "VIEWER";
}

/**
 * Hook to fetch church users with pagination and filtering
 */
export function useChurchUsers(filters: ChurchUsersFilters = {}) {
  const queryString = new URLSearchParams();
  
  if (filters.page) queryString.append("page", filters.page.toString());
  if (filters.limit) queryString.append("limit", filters.limit.toString());
  if (filters.search) queryString.append("search", filters.search);
  if (filters.role) queryString.append("role", filters.role);
  if (filters.isActive !== undefined) queryString.append("isActive", filters.isActive.toString());
  if (filters.memberId) queryString.append("memberId", filters.memberId);

  return useQuery<ChurchUsersResponse>({
    queryKey: ["churchUsers", filters],
    queryFn: async () => {
      const res = await api.get(`/church-users?${queryString.toString()}`);
      const { data, meta } = extractPaginatedData(res);
      return {
        churchUsers: data as ChurchUser[],
        total: meta?.total ?? 0,
        page: meta?.page ?? 1,
        pageSize: meta?.limit ?? 20,
      };
    },
    placeholderData: (prev) => prev,
  });
}

/**
 * Hook to fetch church users by member ID
 */
export function useChurchUsersByMember(memberId: string, filters: ChurchUsersFilters = {}) {
  const queryString = new URLSearchParams();
  
  if (filters.page) queryString.append("page", filters.page.toString());
  if (filters.limit) queryString.append("limit", filters.limit.toString());

  return useQuery<ChurchUsersResponse>({
    queryKey: ["churchUsers", "member", memberId, filters],
    queryFn: async () => {
      const res = await api.get(`/church-users/member/${memberId}?${queryString.toString()}`);
      const { data, meta } = extractPaginatedData(res);
      // Extract churchUsers from the data object
      const churchUsersData = data as { churchUsers?: ChurchUser[] };
      return {
        churchUsers: churchUsersData.churchUsers ?? [],
        total: meta?.total ?? 0,
        page: meta?.page ?? 1,
        pageSize: meta?.limit ?? 20,
      };
    },
    enabled: !!memberId,
    placeholderData: (prev) => prev,
  });
}

/**
 * Hook to fetch single church user
 */
export function useChurchUser(id: string) {
  return useQuery<ChurchUser>({
    queryKey: ["churchUser", id],
    queryFn: async () => {
      const res = await api.get(`/church-users/${id}`);
      return extractData(res) as ChurchUser;
    },
    enabled: !!id,
  });
}

/**
 * Hook to create church user
 */
export function useCreateChurchUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChurchUserInput) => {
      const res = await api.post("/church-users", data);
      return extractData(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["churchUsers"] });
    },
  });
}

/**
 * Hook to update church user
 */
export function useUpdateChurchUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateChurchUserInput }) => {
      const res = await api.patch(`/church-users/${id}`, data);
      return extractData(res);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["churchUsers"] });
      queryClient.invalidateQueries({ queryKey: ["churchUser", variables.id] });
    },
  });
}

/**
 * Hook to delete church user
 */
export function useDeleteChurchUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/church-users/${id}`);
      return extractData(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["churchUsers"] });
    },
  });
}

/**
 * Hook to reset user password
 */
export function useResetUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const res = await api.post(`/church-users/${id}/reset-password`, { newPassword });
      return extractData(res);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["churchUser", variables.id] });
    },
  });
}

/**
 * Hook to toggle user status
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/church-users/${id}/status`);
      return extractData(res);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["churchUsers"] });
      queryClient.invalidateQueries({ queryKey: ["churchUser", variables] });
    },
  });
}
