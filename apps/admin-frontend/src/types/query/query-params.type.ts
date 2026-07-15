export interface PaginatedQuery {
  page?: number;
  limit?: number;
}

export interface DataLookupQuery {
  category?: string;
  type?: string;
}

export interface StaffsQuery extends PaginatedQuery {
  state?: string;
}

export interface RoleQuery extends PaginatedQuery {
  state?: string;
}

export interface FellowshipQuery extends PaginatedQuery {
  state?: string;
}

export interface MembersQuery extends PaginatedQuery {
  state?: string;
  typeId?: string;
  regionId?: string;
  search?: string;
  councilFellowshipId?: string;
  isInEthiopia?: string;
  reportStatus?: string;
  reportYear?: number;
  filterByReport:boolean;
  memberTypeChanged?:string
}

export interface ReportsQuery extends PaginatedQuery {
  status?: string;
  member?: string;
  fellowship?: string;
}

export interface FilesQuery extends PaginatedQuery {
  member?: string;
  fellowship?: string;
  isFromSelamMinster?: boolean;
}
