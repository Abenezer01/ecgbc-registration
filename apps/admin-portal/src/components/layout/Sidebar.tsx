"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Database,
  LogOut,
  ChevronRight,
  Building2,
  Settings,
  Sun,
  Moon,
  History,
  DollarSign,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard",     href: "/dashboard",   icon: LayoutDashboard, permission: "view_dashboard" },
  { name: "Members",       href: "/members",      icon: Users, permission: "view_member" },
  { name: "Fellowships",   href: "/fellowships",  icon: Building2, permission: "view_fellowship" },
  { name: "Reports",       href: "/reports",      icon: FileText, permission: "view_report" },
  { name: "Finance",       href: "/finance",      icon: DollarSign, permission: "view_finance" },
  { name: "Master Data",   href: "/lookup",       icon: Database,   permission: "view_permission" },
  { name: "Activity Logs", href: "/logs",         icon: History,    permission: "view_logs" },
  { name: "Name Check",    href: "/name-reservation", icon: ShieldAlert, permission: "view_member" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, hasPermission, staff } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  const navLink = (item: NavItem) => {
    const isActive =
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
            )}
          />
          {item.name}
        </div>
        {isActive && <ChevronRight className="h-3.5 w-3.5 text-blue-400 dark:text-blue-500" />}
      </Link>
    );
  };

  const settingsActive = pathname.startsWith("/settings");

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#09090b] h-screen">

      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm shadow-blue-500/30">
          E
        </div>
        <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-white">
          ECGBC Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          if (item.permission && !hasPermission(item.permission)) return null;
          return navLink(item);
        })}

        {/* System section */}
        {(hasPermission("view_role") || hasPermission("view_staff")) && (
          <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
              System
            </p>
          <Link
            href="/settings"
            className={cn(
              "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
              settingsActive
                ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Settings className={cn("h-4 w-4 shrink-0", settingsActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-400")} />
              Settings
            </div>
            {settingsActive && <ChevronRight className="h-3.5 w-3.5 text-blue-400 dark:text-blue-500" />}
          </Link>
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div className="border-t border-zinc-200 dark:border-zinc-800/80 p-3 space-y-1">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar
            fallback={`${staff?.firstName?.[0] ?? ""}${staff?.lastName?.[0] ?? ""}`}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
              {staff?.firstName} {staff?.lastName}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {staff?.role?.name ?? "Staff"}
            </p>
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
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
    </aside>
  );
}
