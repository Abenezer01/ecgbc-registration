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
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-52 -right-52 h-96 w-96 rounded-full bg-blue-500 opacity-[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-52 -left-52 h-96 w-96 rounded-full bg-violet-500 opacity-[0.08] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            {/* Logo mark */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xl shadow-lg shadow-blue-500/30">
              E
            </div>
            <CardTitle className="text-xl">ECGBC Admin Portal</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <FormField id="email" label="Email address" error={errors.email} required>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                />
              </FormField>

              <Button
                type="submit"
                className="w-full mt-2"
                size="lg"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
