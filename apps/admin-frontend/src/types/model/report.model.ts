import { Abstract } from "./abstract.model";
import { DataLookup } from "./data-lookup.model";
import { CouncilFellowship } from "./fellowship.model";
import { Member } from "./member.model";

export interface Report extends Abstract {
  year: number;
  reportedAt: string;
  uploadedAt: string;
  file?: string;
  crv?: string;
  remark?: string;
  status: DataLookup;
  member?: Member;
  councilFellowship?: CouncilFellowship;
}

export interface NewReport {
  reportedAt: Date | null;
  year:number;
  report?: string | File;
  crv?: string;
  remark?: string;
  memberId?: string;
  councilFellowshipId?: string;
}
export interface UpdatedReport {
  reportedAt?:  Date | null ;
  report?: string | File;
  crv?: string;
  remark?: string;
  reportId?: string;
  councilFellowshipId?: string;
}
