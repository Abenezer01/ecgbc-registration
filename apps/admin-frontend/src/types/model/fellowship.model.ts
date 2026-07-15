import { Abstract } from "./abstract.model";
import { BoardMember } from "./board-member.model";
import { NewBoardMember } from "./member.model";
import { Report } from "./report.model";
import { IFile } from "./file.model";

export interface CouncilFellowship extends Abstract {
  name: string;
  certificateNo: string;
  isInEthiopia: boolean;
  certificateIssuedDate: Date | null;
  country: string;
  region: string | any;
  city?: string;
  subcity?: string;
  zone?: string;
  district?: string;
  houseNumber?: string;
  phoneNumber?: string;
  poBoxNumber?: string;
  email?: string;
  boardMembers: BoardMember[];
  reports: Report[];
  files: IFile[];
}

export interface NewCouncilFellowship {
  name: string;
  certificateNo: string;
  isInEthiopia: boolean;
  certificateIssuedDate: Date | null;
  country: string;
  region: string;
  city?: string;
  subcity?: string;
  zone?: string;
  district?: string;
  houseNumber?: string;
  phoneNumber?: string;
  poBoxNumber?: string;
  email?: string;
  boardMembers: NewBoardMember[];
}
