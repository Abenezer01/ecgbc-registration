"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, setAuth, logout } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("church_portal_token");
      
      if (!token) {
        if (pathname !== "/login") {
          router.push("/login");
        }
        setIsVerifying(false);
        return;
      }

      try {
        const { data } = await api.get("/church-auth/me");
        
        // Transform backend response
        const user = {
          id: data.data.id,
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          email: data.data.email,
          phone: data.data.phone,
          role: data.data.role as any,
          memberId: data.data.memberId,
        };

        const church = {
          id: data.data.member.id,
          name: data.data.member.name,
          certificateNo: data.data.member.certificateNo,
        };

        setAuth(user, church);

        if (pathname === "/login") {
          router.push("/dashboard");
        }
      } catch (error) {
        logout();
        if (pathname !== "/login") {
          router.push("/login");
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [pathname, router, setAuth, logout]);

  if (isVerifying) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated and trying to access a protected route, don't render children
  if (!isAuthenticated && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}
