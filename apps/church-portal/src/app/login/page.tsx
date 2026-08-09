"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Toaster } from "react-hot-toast";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsLoading(true);
      const { data } = await api.post("/church-auth/login", formData);
      
      localStorage.setItem("church_portal_token", data.data.accessToken);
      localStorage.setItem("church_portal_refresh_token", data.data.refreshToken);
      setAuth(data.data.user, data.data.church);
      
      router.push("/dashboard");
    } catch (err: any) {
      const message = err.response?.data?.message || "Incorrect email or password. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-zinc-950">
      <Toaster position="top-center" />
      
      {/* Left Side: Brand & Visual (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden p-12 text-white">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689173/hero-bg_kjbgea.jpg" 
            alt="ECGBC Background" 
            className="w-full h-full object-cover"
          />
          {/* Slightly different tint for church portal: deeper slate/blue mix */}
          <div className="absolute inset-0 bg-slate-900/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent" />
        </div>

        {/* Logo Section */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-xl shadow-black/20">
            <img 
              src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689161/logo_wzaui5.png" 
              alt="ECGBC Logo" 
              className="w-8 h-8 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[10px] leading-tight tracking-[0.1em] uppercase text-white/80">Ethiopian Council of</span>
            <span className="font-black text-lg leading-none tracking-tight uppercase text-white">Gospel Believers' Churches</span>
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-md mt-auto pb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Official Church Portal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Manage your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-300">Church Profile.</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Access your dashboard to manage annual reports, update contact information, and track compliance status seamlessly.
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-900 shadow-xl mb-4">
              <img 
                src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689161/logo_wzaui5.png" 
                alt="ECGBC Logo" 
                className="w-10 h-10 object-contain brightness-0 invert"
              />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight">ECGBC Church Portal</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">Sign In</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Enter your credentials to access your church's account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-slate-900 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-500 outline-none transition-all"
                placeholder="church@ecgbc.org"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-slate-900 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-500 outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-11 rounded-lg font-medium text-white transition-all shadow-lg shadow-slate-900/20",
                "bg-slate-900 hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/20",
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

          <div className="mt-8 text-center">
            <p className="text-xs text-neutral-400">
              © {new Date().getFullYear()} Ethiopian Council of Gospel Believers' Churches. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
