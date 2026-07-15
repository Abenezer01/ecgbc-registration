import { Staff } from "../types/model/staff.model";

export const hasPermission = (user: Staff, permissionName: string): boolean => {
  if (!user) return false;
  return user.role.permissions.some(
    (permission) => permission.codeName === permissionName
  );
};
