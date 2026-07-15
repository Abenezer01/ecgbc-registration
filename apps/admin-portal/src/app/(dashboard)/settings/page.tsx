"use client";

import React from "react";
import { Sun, Moon, Monitor, Palette, Users, ShieldCheck } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import Link from "next/link";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun, description: "Clean, bright interface" },
  { value: "dark",  label: "Dark",  icon: Moon, description: "Easy on the eyes" },
  { value: "system", label: "System", icon: Monitor, description: "Follows your OS preference" },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { staff, hasPermission } = useAuth();

  const canViewStaff = hasPermission("view_staff");
  const canViewRoles = hasPermission("view_role");

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage your portal appearance and administration settings."
      />

      {/* ── Appearance ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            Appearance
          </h2>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">Theme</p>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map(({ value, label, icon: Icon, description }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all text-center",
                    active
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-xl",
                    active ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold", active ? "text-blue-700 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300")}>
                      {label}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
                  </div>
                  {active && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Administration ── */}
      {(canViewStaff || canViewRoles) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
              Administration
            </h2>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800">
            {canViewStaff && (
              <Link
                href="/settings/staff"
                className="flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Staff Management
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Add, edit, and manage staff accounts
                    </p>
                  </div>
                </div>
                <span className="text-zinc-300 dark:text-zinc-600 group-hover:text-blue-400 transition-colors">›</span>
              </Link>
            )}
            {canViewRoles && (
              <Link
                href="/settings/roles"
                className="flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Role Management
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Configure roles and permission sets
                    </p>
                  </div>
                </div>
                <span className="text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-400 transition-colors">›</span>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ── Account Info ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            Your Account
          </h2>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
              {staff?.firstName?.[0]?.toUpperCase()}{staff?.lastName?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-900 dark:text-white">
                {staff?.firstName} {staff?.lastName}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{staff?.email}</p>
              {staff?.role?.name && (
                <Badge variant="secondary" className="mt-1">{staff.role.name}</Badge>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
