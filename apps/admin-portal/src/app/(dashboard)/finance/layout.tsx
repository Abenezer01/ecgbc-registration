"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "Dashboard", href: "/finance", icon: LayoutDashboard },
    { name: "Reporting Fees", href: "/finance/fees", icon: FileText },
    { name: "Settings", href: "/finance/settings", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Finance</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Manage member reporting fees, view revenue, and configure fee rates.
        </p>
      </div>

      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "group inline-flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium",
                  isActive
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-500 dark:group-hover:text-zinc-400"
                  )}
                  aria-hidden="true"
                />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-2">{children}</div>
    </div>
  );
}
