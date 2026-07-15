import { create } from "zustand";

export interface ChurchUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "EDITOR" | "VIEWER";
}

export interface ChurchInfo {
  id: string;
  name: string;
  certificateNo: string;
  type?: string;
  state?: string;
}

interface AuthState {
  user: ChurchUser | null;
  church: ChurchInfo | null;
  isAuthenticated: boolean;
  setAuth: (user: ChurchUser, church: ChurchInfo) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  church: null,
  isAuthenticated: false,
  setAuth: (user, church) => set({ user, church, isAuthenticated: true }),
  logout: () => {
    localStorage.removeItem("church_portal_token");
    set({ user: null, church: null, isAuthenticated: false });
  },
}));
