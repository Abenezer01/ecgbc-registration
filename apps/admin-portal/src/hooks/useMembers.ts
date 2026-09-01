import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/useApi";
import type { Member } from "../types";
import { buildQueryString } from "../lib/query-builder";
import { extractData, extractPaginatedData } from "../lib/response-parser";

export type { Member };

export interface MembersResponse {
  members: Member[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MembersFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  fellowshipId?: string;
  councilFellowshipId?: string;
  typeId?: string;
  stateId?: string;
  regionId?: string;
  isInEthiopia?: string;
  memberTypeChanged?: string;
  filterByReport?: boolean;
  reportStatus?: string;
  reportYear?: number;
  isActive?: boolean;
}

export function useMembers(filters: MembersFilters = {}) {
  const { get } = useApi();

  return useQuery<MembersResponse>({
    queryKey: ["members", filters],
    queryFn: async () => {
      const queryString = buildQueryString({
        page: filters.page,
        limit: filters.pageSize,
        search: filters.search,
        filters: {
          councilFellowshipId: (filters.councilFellowshipId || filters.fellowshipId) !== 'all'
            ? (filters.councilFellowshipId || filters.fellowshipId)
            : undefined,
          typeId: filters.typeId !== 'all' ? filters.typeId : undefined,
          stateId: filters.stateId !== 'all' ? filters.stateId : undefined,
          regionId: filters.regionId !== 'all' ? filters.regionId : undefined,
          isInEthiopia: filters.isInEthiopia !== 'all' ? filters.isInEthiopia : undefined,
          memberTypeChanged: filters.memberTypeChanged !== 'all' ? filters.memberTypeChanged : undefined,
          filterByReport: filters.filterByReport ? filters.filterByReport : undefined,
          reportStatus: filters.reportStatus !== 'all' ? filters.reportStatus : undefined,
          reportYear: filters.filterByReport ? filters.reportYear : undefined,
          isActive: filters.isActive,
        },
      });

      const res = await get(`/members${queryString}`);
      const { data, meta } = extractPaginatedData(res);
      return {
        members: (data as any).members,
        total: meta?.total ?? 0,
        page: meta?.page ?? 1,
        pageSize: meta?.limit ?? 20,
      };
    },
    placeholderData: (prev) => prev,
  });
}

export function useMember(id: string | null) {
  const { get } = useApi();

  return useQuery<Member>({
    queryKey: ["member", id],
    queryFn: async () => {
      const res = await get(`/members/${id}`);
      const data = extractData(res);
      return (data as any).member;
    },
    enabled: !!id,
  });
}

export function useCreateMember() {
  const { post } = useApi();

  return useMutation({
    mutationFn: async ({ newMember, files, fileCategories }: { newMember: any; files: File[]; fileCategories?: Record<number, string> }) => {
      const formData = new FormData();
      Object.keys(newMember).forEach((key) => {
        const formValue = newMember[key];
        if (key === 'boardMembers') {
          formData.append(key, JSON.stringify(formValue));
        } else if (key === 'certificateIssuedDate' && formValue) {
          const date = new Date(formValue);
          const year = date.getFullYear();
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;
          formData.append(key, formattedDate);
        } else if (formValue !== null && formValue !== undefined) {
          formData.append(key, String(formValue));
        }
      });

      // Append file category IDs as a JSON array matching the order of memberFiles
      if (fileCategories) {
        const categoryIds = files.map((_, idx) => fileCategories[idx] || "");
        formData.append('fileCategoryIds', JSON.stringify(categoryIds));
      }

      files.forEach((file) => {
        formData.append('memberFiles', file);
      });

      const res = await post(`/members`, formData);
      const data = extractData(res);
      return (data as any).member;
    },
  });
}

export function useUpdateMember() {
  const { patch } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const body: any = { ...data };
      // Stringify boardMembers for the backend
      if (Array.isArray(body.boardMembers)) {
        body.boardMembers = body.boardMembers;
      }
      // Format date the same way as create
      if (body.certificateIssuedDate) {
        const d = new Date(body.certificateIssuedDate);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, "0");
        const day = d.getDate().toString().padStart(2, "0");
        body.certificateIssuedDate = `${year}-${month}-${day}`;
      }
      const res = await patch(`/members/${id}`, body);
      const extracted = extractData(res);
      return (extracted as any).member;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["member", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useRegenerateCertificate() {
  const { post } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await post(`/members/${memberId}/regenerate-certificate`, {});
      return extractData(res);
    },
    onSuccess: (_, memberId) => {
      // Invalidate both member details and their files
      queryClient.invalidateQueries({ queryKey: ["member", memberId] });
      queryClient.invalidateQueries({ queryKey: ["memberFiles", memberId] });
      queryClient.invalidateQueries({ queryKey: ["documentCompleteness", memberId] });
    },
  });
}
