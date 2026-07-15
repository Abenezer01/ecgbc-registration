"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Users, Building2, Database, LogOut, Settings, Sun, Moon, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { name: "Dashboard",    href: "/dashboard",   icon: LayoutDashboard },
  { name: "Members",      href: "/members",      icon: Users },
  { name: "Fellowships",  href: "/fellowships",  icon: Building2 },
  { name: "Master Data",href: "/lookup",       icon: Database, permission: "view_lookup" },
  { name: "Activity Logs",href: "/logs",         icon: History,  permission: "view_logs" },
  { name: "Settings",     href: "/settings",     icon: Settings },
];

export function Topbar() {
  const { staff, logout, hasPermission } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  // Derive page title from pathname
  const current = NAV_ITEMS.find((n) =>
    n.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(n.href)
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800/80 dark:bg-[#09090b]/80 md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
            {current?.name ?? "ECGBC"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Avatar
            fallback={`${staff?.firstName?.[0] ?? ""}${staff?.lastName?.[0] ?? ""}`}
            size="sm"
          />
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white dark:bg-[#09090b] shadow-xl md:hidden"
            >
              {/* Header */}
              <div className="flex h-14 items-center justify-between px-5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">E</div>
                  <span className="font-semibold text-sm text-zinc-900 dark:text-white">ECGBC Admin</span>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-md p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Links */}
              <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
                <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Menu</p>
                {NAV_ITEMS.map((item) => {
                  if ((item as any).permission && !hasPermission((item as any).permission)) return null;
                  const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-400")} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 space-y-1">
                <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <Avatar fallback={`${staff?.firstName?.[0] ?? ""}${staff?.lastName?.[0] ?? ""}`} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{staff?.firstName} {staff?.lastName}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{staff?.role?.name ?? "Staff"}</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    aria-label="Toggle theme"
                  >
                    {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
