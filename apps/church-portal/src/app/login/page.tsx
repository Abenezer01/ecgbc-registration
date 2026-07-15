"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Church } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const { data } = await api.post("/church-auth/login", formData);
      
      localStorage.setItem("church_portal_token", data.data.accessToken);
      setAuth(data.data.user, data.data.church);
      
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-100">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Church className="w-6 h-6" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Church Portal
            </h1>
            <p className="text-neutral-500 mt-2 text-sm">
              Sign in to manage your church's account and reports.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-2.5 px-4 rounded-lg font-medium text-white transition-all",
                "bg-primary hover:bg-primary/90 focus:ring-4 focus:ring-primary/20",
                "flex items-center justify-center",
                isLoading && "opacity-70 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-neutral-50 px-8 py-4 border-t border-neutral-100 text-center">
          <p className="text-sm text-neutral-500">
            Having trouble logging in?{" "}
            <a href="#" className="text-primary hover:underline font-medium">
              Contact ECGBC Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
