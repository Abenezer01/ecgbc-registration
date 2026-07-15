import { Abstract } from "./abstract.model";
import { BoardMember } from "./board-member.model";
import { DataLookup } from "./data-lookup.model";
import { CouncilFellowship } from "./fellowship.model";
import { Report } from "./report.model";

export interface Member extends Abstract {
  name: string;
  certificateNo: string;
  fellowship: CouncilFellowship;
  typeId: string;
  councilFellowshipId: string;
  councilFellowship?: CouncilFellowship;
  type: DataLookup;
  state: DataLookup;
  isInEthiopia: boolean;
  certificateIssuedDate: string;
  country?: string | { label?: string; value?: string };
  region?: DataLookup | { label?: string; value?: string };
  regionId?: string;
  city?: string | { label?: string; value?: string };
  subcity?: string;
  zone?: string;
  district?: string;
  houseNumber?: string;
  phoneNumber?: string;
  poBoxNumber?: string;
  email?: string;
  isActive: boolean; // Add this line
  reasonForInactive?: string;
  boardMembers: BoardMember[];
  reports: Report[];
}

export interface NewMember {
  name: string;
  certificateNo: string;
  councilFellowshipId: string;
  typeId: string;
  stateId: string;
  isInEthiopia: boolean;
  certificateIssuedDate: string | null;
  country: string;
  regionId?: string;
  city?: string;
  phoneNumber?: string;
  email?: string;
  isActive: boolean; // Add this line if needed for new members
  boardMembers: NewBoardMember[];
}

export interface NewBoardMember {
  id: string;
  fullName: string;
  phoneNumber: string;
}