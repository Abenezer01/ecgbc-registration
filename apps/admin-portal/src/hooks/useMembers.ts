import { useQuery, useMutation } from "@tanstack/react-query";
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
    mutationFn: async ({ newMember, files }: { newMember: any; files: File[] }) => {
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

      files.forEach((file) => {
        formData.append('memberFiles', file);
      });

      const res = await post(`/members`, formData);
      const data = extractData(res);
      return (data as any).member;
    },
  });
}