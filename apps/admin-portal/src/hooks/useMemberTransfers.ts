import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface FellowshipSummary {
  id: string;
  name: string;
  certificateNo?: string;
  region?: { id: string; description: string; value: string };
}

export interface RegionSummary {
  id: string;
  description: string;
  value: string;
}

export interface MemberTransferItem {
  id: string;
  memberId: string;
  fromFellowshipId: string;
  toFellowshipId: string;
  fromRegionId?: string | null;
  toRegionId?: string | null;
  fromCity?: string | null;
  fromSubcity?: string | null;
  fromZone?: string | null;
  fromDistrict?: string | null;
  fromHouseNumber?: string | null;
  toCity?: string | null;
  toSubcity?: string | null;
  toZone?: string | null;
  toDistrict?: string | null;
  toHouseNumber?: string | null;
  transferType: "REDISTRICTING" | "RELOCATION" | "ADMINISTRATIVE" | "OTHER";
  reason?: string | null;
  referenceNumber?: string | null;
  documentUrl?: string | null;
  effectiveDate: string;
  performedBy?: string | null;
  createdAt: string;
  fromFellowship: FellowshipSummary;
  toFellowship: FellowshipSummary;
  fromRegion?: RegionSummary | null;
  toRegion?: RegionSummary | null;
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface MemberTransfersResponse {
  currentMember: any;
  transfers: MemberTransferItem[];
}

export interface TransferMemberPayload {
  memberId: string;
  toFellowshipId: string;
  toRegionId?: string;
  transferType?: "REDISTRICTING" | "RELOCATION" | "ADMINISTRATIVE" | "OTHER";
  reason?: string;
  referenceNumber?: string;
  documentUrl?: string;
  effectiveDate?: string;
  toCity?: string;
  toSubcity?: string;
  toZone?: string;
  toDistrict?: string;
  toHouseNumber?: string;
}

export function useMemberTransfers(memberId: string | null) {
  return useQuery<MemberTransfersResponse>({
    queryKey: ["memberTransfers", memberId],
    queryFn: async () => {
      const res = await api.get(`/members/${memberId}/transfers`);
      return res.data.data;
    },
    enabled: !!memberId,
  });
}

export function useTransferMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TransferMemberPayload) => {
      const { memberId, ...body } = payload;
      const res = await api.post(`/members/${memberId}/transfer`, body);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["member", variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["memberTransfers", variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ["activityLogs"] });
    },
  });
}
