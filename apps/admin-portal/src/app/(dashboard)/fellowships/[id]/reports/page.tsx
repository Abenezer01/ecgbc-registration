"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, FileText, ShieldAlert, Building2 } from "lucide-react";
import { useFellowship } from "@/hooks/useFellowships";
import { useAuth } from "@/hooks/useAuth";

export default function FellowshipReportsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: fellowship, isLoading } = useFellowship(id);
  const { hasPermission } = useAuth();

  const canViewMembers = hasPermission("view_member");
  const canViewReports = hasPermission("view_report");
  const canManageSettings = hasPermission("change_fellowship");

  const tabs = [
    { id: "overview", label: "Overview", icon: <Building2 />, path: `/fellowships/${id}/overview` },
    { id: "members", label: "Members", icon: <Users />, path: `/fellowships/${id}/members`, visible: canViewMembers },
    { id: "reports", label: "Reports", icon: <FileText />, path: `/fellowships/${id}/reports`, visible: canViewReports },
    { id: "settings", label: "Settings", icon: <ShieldAlert />, path: `/fellowships/${id}/settings`, visible: canManageSettings },
  ];

  const visibleTabs = tabs.filter(tab => tab.visible !== false);
  const currentPath = `/fellowships/${id}/reports`;

  if (isLoading) {
    return <div className="p-10 text-center animate-pulse">Loading...</div>;
  }

  if (!fellowship) {
    return (
      <div className="p-10 text-center text-zinc-500">
        Fellowship not found.
      </div>
    );
  }

  const f = fellowship as any;

  return (
    <>
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => router.push(tab.path)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative
                  ${currentPath === tab.path 
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }
                `}
              >
                {React.cloneElement(tab.icon as React.ReactElement<any>, { className: "h-4 w-4" })}
                {tab.label}
                {currentPath === tab.path && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center py-12 bg-white dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <FileText className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
              Fellowship Reports
            </h3>
            <p className="text-zinc-500 text-sm mb-4">
              This section will display reports submitted by {f.name}
            </p>
            <p className="text-xs text-zinc-400">
              Total Reports: {f.reports?.length || 0}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
