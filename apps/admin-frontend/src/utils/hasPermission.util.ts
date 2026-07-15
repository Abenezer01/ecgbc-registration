import { RootState } from "../store/store";
import { Permission } from "../types/model/permssion.model";

// Selector function to check if the user has a specific permission
export const hasPermission = (
  state: RootState,
  permission: string
): boolean => {
  const userPermissions =
    state.auth.staff?.role.permissions.map(
      (permission) => permission.codeName
    ) || [];
  return userPermissions.includes(permission);
};

export const userHasPermission = (
  userPermissions: Permission[],
  permissions: string[]
): boolean => {
  const usersPermissions =
    userPermissions.map((permission) => permission.codeName) || [];
  return permissions.some((permission) =>
    usersPermissions.includes(permission)
  );
};
