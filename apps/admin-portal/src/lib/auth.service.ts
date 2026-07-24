import api from "./api";
import { AuthData, Staff, RBACScope, Permission } from "../types";

const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";

/**
 * Auth Service - Centralized authentication logic for frontend
 * Handles login, logout, token management, and permission checking
 */

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(TOKEN_KEY);
};

/**
 * Get access token
 */
export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get refresh token
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Store auth tokens
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  
  // Set cookie for server-side requests
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  document.cookie = `token=${accessToken}; path=/; max-age=604800; SameSite=Strict; Secure`;
  document.cookie = `refreshToken=${refreshToken}; path=/; max-age=604800; SameSite=Strict; Secure`;
};

/**
 * Clear auth tokens
 */
export const clearTokens = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = "token=; path=/; max-age=0; SameSite=Strict; Secure";
  document.cookie = "refreshToken=; path=/; max-age=0; SameSite=Strict; Secure";
};

/**
 * Login user with credentialss
 */
export const login = async (
  email: string,
  password: string
): Promise<AuthData> => {
  const response = await api.post<{ data: AuthData }>("/auth/login", {
    email,
    password,
  });

  const { accessToken, refreshToken, staff, rbac } = response.data.data;
  
  setTokens(accessToken, refreshToken || "");
  
  return {
    accessToken,
    staff,
    rbac,
  };
};

/**
 * Logout user
 */
export const logout = (): void => {
  clearTokens();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (): Promise<string | null> => {
  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) {
    return null;
  }

  try {
    const response = await api.post<{ data: { accessToken: string } }>("/auth/refresh", {
      refreshToken: refreshTokenValue,
    });

    const newAccessToken = response.data.data.accessToken;
    setTokens(newAccessToken, refreshTokenValue);
    return newAccessToken;
  } catch (error) {
    logout();
    return null;
  }
};

/**
 * Check if staff has specific permission
 */
export const hasPermission = (
  staff: Staff | null,
  permissionCode: string
): boolean => {
  if (isOwner(staff)) return true;
  if (!staff || !staff.role || !staff.role.permissions) return false;
  // Type assertion to satisfy TypeScript - we've already checked that role and permissions are defined
  const permissions = staff.role.permissions as Permission[];
  return permissions.some((p) => p.codeName === permissionCode);
};

/**
 * Check if staff has any of the specified permissions
 */
export const hasAnyPermission = (
  staff: Staff | null,
  permissionCodes: string[]
): boolean => {
  if (isOwner(staff)) return true;
  if (!staff || !staff.role || !staff.role.permissions) return false;
  const permissions = staff.role.permissions as Permission[];
  return permissionCodes.some((code) => 
    permissions.some((p) => p.codeName === code)
  );
};

/**
 * Check if staff has all of the specified permissions
 */
export const hasAllPermissions = (
  staff: Staff | null,
  permissionCodes: string[]
): boolean => {
  if (isOwner(staff)) return true;
  if (!staff || !staff.role || !staff.role.permissions) return false;
  const permissions = staff.role.permissions as Permission[];
  return permissionCodes.every((code) => 
    permissions.some((p) => p.codeName === code)
  );
};

/**
 * Check if user has owner role
 */
export const isOwner = (staff: Staff | null): boolean => {
  return staff?.role?.type?.value === "role_type_owner";
};

/**
 * Check if user can access members (based on RBAC)
 */
export const canAccessMembers = (
  staff: Staff | null,
  rbac: RBACScope | null
): boolean => {
  // If owner or has member permission, can access
  if (isOwner(staff)) return true;
  if (hasAnyPermission(staff, ["add_member", "view_member", "change_member"])) {
    return true;
  }
  // Check RBAC
  if (rbac && rbac.allowedFellowshipIds && rbac.allowedFellowshipIds.length > 0) {
    return true;
  }
  return false;
};
