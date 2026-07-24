"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { login as authLogin } from "@/lib/auth.service";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/ui/Toast";
import {
  Button,
  Input,
  FormField,
} from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 6) e.password = "Password must be at least 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const authResponse = await authLogin(email, password);
      login(authResponse.accessToken, authResponse.staff, authResponse.rbac);
      addToast({ variant: "success", title: "Welcome back!", description: `Signed in as ${authResponse.staff.firstName}` });
      window.location.href = "/dashboard";
    } catch (err: any) {
      const msg = err.response?.data?.errors?.[0]?.msg || "Invalid email or password.";
      addToast({ variant: "error", title: "Sign-in failed", description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-zinc-950">
      {/* Left Side: Brand & Visual (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden p-12 text-white">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689173/hero-bg_kjbgea.jpg" 
            alt="ECGBC Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-blue-900/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-900/50 to-transparent" />
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
            Official Admin Portal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            A United Voice for <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-300">Gospel Believers.</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            The umbrella organization representing the evangelical churches of Ethiopia. Standing together for the Gospel, Peace, and National Transformation.
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mx-auto w-full max-w-sm"
        >
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-900 shadow-xl mb-4">
              <img 
                src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689161/logo_wzaui5.png" 
                alt="ECGBC Logo" 
                className="w-10 h-10 object-contain brightness-0 invert"
              />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight">ECGBC Admin Portal</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Sign In</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Enter your credentials to access the administrative dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FormField id="email" label="Email address" error={errors.email} required>
              <Input
                id="email"
                type="email"
                placeholder="name@ecgbc.org"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </FormField>

            <FormField id="password" label="Password" error={errors.password} required>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </FormField>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-900 hover:bg-blue-800 text-white font-medium text-base shadow-lg shadow-blue-900/20 mt-2"
              loading={loading}
              disabled={loading}
            >
              Sign In
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-400">
              © {new Date().getFullYear()} Ethiopian Council of Gospel Believers' Churches. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
