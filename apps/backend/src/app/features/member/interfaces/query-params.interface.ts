import { AbstractQueryParams } from "../../../shared/interfaces/query.interface";

export interface GetMembersQueryParams extends AbstractQueryParams {
  stateId?: string;
  typeId?: string;
  reportStatus?: string;
  regionId?: string;
  councilFellowshipId?: string;
  isInEthiopia?: string;
  reportYear?:number;
  filterByReport?: boolean;
  memberTypeChanged?:'changed'|'not_changed' | 'all';
}
