import { Abstract } from "./abstract.model";
import { CouncilFellowship } from "./fellowship.model";
import { Member } from "./member.model";

export interface BoardMember extends Abstract {
  member?: Member;
  councilFelowship?: CouncilFellowship;
  fullName: string;
  phoneNumber: string;
}
