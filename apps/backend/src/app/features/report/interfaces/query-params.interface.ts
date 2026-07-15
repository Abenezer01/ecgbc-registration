import { AbstractQueryParams } from "../../../shared/interfaces/query.interface";

export interface GetReportsQueryParams extends AbstractQueryParams {
  status?: string;
  memberId?: string;
  fellowshipId?: string;
}
