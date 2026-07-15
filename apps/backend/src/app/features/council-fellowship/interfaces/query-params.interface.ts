import { AbstractQueryParams } from "../../../shared/interfaces/query.interface";

export interface GetFellowshipsQueryParams extends AbstractQueryParams {
    state?: string;
    regionId?: string;
    isActive?: string;
    _sort?: string;
    _order?: string;
}