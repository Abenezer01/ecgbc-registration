import { AbstractQueryParams } from "../../../shared/interfaces/query.interface";

export interface GetFilesQueryParams extends AbstractQueryParams {
  memberId?: string;
  fellowshipId?: string;
  isFromSelamMinster?:string
}
