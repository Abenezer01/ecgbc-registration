"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, setAuth, logout } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const hasVerified = useRef(false);

  useEffect(() => {
    // Only verify once on mount, not on every pathname change
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyToken = async () => {
      const token = localStorage.getItem("church_portal_token");

      if (!token) {
        setIsVerifying(false);
        if (pathname !== "/login") router.push("/login");
        return;
      }

      try {
        const { data } = await api.get("/church-auth/me");

        const user = {
          id: data.data.id,
          memberId: data.data.memberId,
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          email: data.data.email,
          phone: data.data.phone ?? null,
          role: data.data.role as "ADMIN" | "EDITOR" | "VIEWER",
        };

        const church = {
          id: data.data.member.id,
          name: data.data.member.name,
          certificateNo: data.data.member.certificateNo,
        };

        setAuth(user, church);

        if (pathname === "/login") router.push("/dashboard");
      } catch {
        // Token is invalid — clear everything and go to login
        localStorage.removeItem("church_portal_token");
        logout();
        if (pathname !== "/login") router.push("/login");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isVerifying) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!isAuthenticated && pathname !== "/login") return null;

  return <>{children}</>;
}
