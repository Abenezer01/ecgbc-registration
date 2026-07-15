"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../lib/api";
import {
  isAuthenticated,
  getAccessToken,
  logout as authLogout,
  hasPermission as checkPermission,
  canAccessMembers,
} from "../lib/auth.service";
import { Staff, RBACScope } from "../types";

interface AuthState {
  isAuthenticated: boolean;
  staff: Staff | null;
  rbac: RBACScope | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, staffData: Staff, rbacData: RBACScope | null) => void;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
  canAccess: (feature: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    staff: null,
    rbac: null,
    isLoading: true,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }
      
      try {
        const response = await api.get("/auth");
        const { staff, rbac } = response.data.data;
        setState({
          isAuthenticated: true,
          staff,
          rbac,
          isLoading: false,
        });
      } catch (error) {
        authLogout();
        setState({ isAuthenticated: false, staff: null, rbac: null, isLoading: false });
      }
    };
    
    if (isAuthenticated()) {
      checkAuth();
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (token: string, staffData: Staff, rbacData: RBACScope | null) => {
    // Note: Tokens are set in auth.service.ts during login
    setState({
      isAuthenticated: true,
      staff: staffData,
      rbac: rbacData,
      isLoading: false,
    });
  };

  const logout = () => {
    authLogout();
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!state.staff) return false;
    return checkPermission(state.staff, permissionCode);
  };

  const canAccess = (feature: string): boolean => {
    if (!state.staff || !state.rbac) return false;
    
    switch (feature) {
      case "members":
        return canAccessMembers(state.staff, state.rbac);
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasPermission, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
