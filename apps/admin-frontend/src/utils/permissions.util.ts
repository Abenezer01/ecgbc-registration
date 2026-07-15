import { RoleType } from "../enums/role-type.enum";
import { Staff } from "../types/model/staff.model";

export const canEditState = (staff: Staff, editedStaff: Staff): boolean => {
  return !(staff.id === editedStaff.id);
};

export const isOwner = (staff: Staff | null): boolean => {
  console.log(staff?.role.type.value === RoleType.OWNER);

  if (!staff) return false;
  return staff.role.type.value === RoleType.OWNER;
};
