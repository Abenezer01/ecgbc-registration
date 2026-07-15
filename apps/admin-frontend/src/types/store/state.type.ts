import { DashboardStat } from "../dashboard-stat.type";
import { DataLookup } from "../model/data-lookup.model";
import { CouncilFellowship } from "../model/fellowship.model";
import { IFile } from "../model/file.model";
import { Member } from "../model/member.model";
import { Permission } from "../model/permssion.model";
import { Report } from "../model/report.model";
import { Role } from "../model/role.model";
import { Staff } from "../model/staff.model";

export interface AuthState {
  token: string | null;
  staff: Staff | null;
  rbac: any | null;
  status: "idle" | "loading" | "failed";
  task:
    | ""
    | "fetch-authenticated-staf"
    | "update-profile"
    | "login"
    | "fetch-dashboard-stat";
  isAuthenticated: boolean;
  dashboardStat: DashboardStat | null;
}
export interface DataLookupState {
  dataLookUps: DataLookup[];
  activeStatus: DataLookup | null;
  status: "idle" | "loading" | "failed";
  task: "" | "fetch-active-status" | "fetch-data-lookups";
  orderStatuses: DataLookup[];
}

export interface RoleState {
  roles: Role[];
  permissions: Permission[];
  role: Role | null;
  status: "idle" | "loading" | "failed";
  task:
    | ""
    | "fetch-permissions"
    | "fetch-roles"
    | "fetch-role"
    | "create-role"
    | "update-role";
  total: number;
  page: number;
  limit: number;
}

export interface StaffState {
  staffs: Staff[];
  staff: Staff | null;
  status: "idle" | "loading" | "failed";
  task: "" | "fetch-staffs" | "fetch-staff" | "create-staff" | "update-staff";
  total: number;
  page: number;
  limit: number;
}

export interface CouncilFellowshipState {
  fellowships: CouncilFellowship[];
  fellowship: CouncilFellowship | null;
  status: "idle" | "loading" | "failed";
  task:
    | ""
    | "fetch-fellowships"
    | "fetch-fellowship"
    | "create-fellowship"
    | "update-fellowship";
  total: number;
  page: number;
  limit: number;
}
export interface MemberState {
  members: Member[];
  member: Member | null;
  status: "idle" | "loading" | "failed";
  task:
    | ""
    | "fetch-members"
    | "fetch-member"
    | "create-member"
    | "update-member";
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

export interface ReportState {
  reports: Report[];
  report: Report | null;
  status: "idle" | "loading" | "failed";
  task:
    | ""
    | "fetch-reports"
    | "fetch-report"
    | "create-report"
    | "update-report"
    | "delete-report";
  total: number;
  page: number;
  limit: number;
}
export interface FileState {
  files: IFile[];
  filesFromSelamMinster: IFile[];
  file: IFile | null;
  status: "idle" | "loading" | "failed";
  task:
    | ""
    | "fetch-files"
    | "fetch-files-from-selam-minster"
    | "fetch-file"
    | "create-file"
    | "create-files"
    | "create-fellowship-files"
    | "update-file"
    | "delete-file";
  total: number;
  page: number;
  limit: number;
  totalDeleted?: number;
}
