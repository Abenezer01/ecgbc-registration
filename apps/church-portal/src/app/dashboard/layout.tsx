"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, FileText, Settings, LogOut, Church, Menu, X, FolderOpen, User, Bell } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Files", href: "/dashboard/files", icon: FolderOpen },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, church, logout } = useAuthStore();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-neutral-50 flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-neutral-100">
          <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center mr-3">
            <Church className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-neutral-900 truncate">
            {church?.name || "Church Portal"}
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-neutral-500 hover:text-neutral-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/5 text-primary"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={cn(
                    "mr-3 flex-shrink-0 w-5 h-5",
                    isActive ? "text-primary" : "text-neutral-400"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="mr-4 lg:hidden text-neutral-500 hover:text-neutral-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-neutral-900 truncate">
              {navigation.find((n) => n.href === pathname)?.name || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-neutral-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-neutral-500 capitalize">{user?.role.toLowerCase()}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
