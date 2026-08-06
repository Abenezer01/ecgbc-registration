"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, Users, FileText, User } from "lucide-react";
import { useFellowship } from "@/hooks/useFellowships";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui";

export default function FellowshipUsersPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: fellowship, isLoading } = useFellowship(id);
  
  const { hasPermission } = useAuth();
  const canViewReports = hasPermission("view_report") || hasPermission("view_member");
  const canManageUsers = hasPermission("view_church_user") || hasPermission("view_member");

  const tabs = [
    { id: "overview", label: "Overview", icon: <User />, path: `/fellowships/${id}/overview` },
    { id: "members", label: "Members", icon: <Building2 />, path: `/fellowships/${id}/members` },
    { id: "reports", label: "Reports", icon: <FileText />, path: `/fellowships/${id}/reports`, visible: canViewReports },
    { id: "users", label: "Fellowship Users", icon: <Users />, path: `/fellowships/${id}/users`, visible: canManageUsers },
  ];

  const visibleTabs = tabs.filter(tab => tab.visible !== false);
  const currentPath = `/fellowships/${id}/users`;

  if (isLoading) {
    return <div className="p-10 text-center animate-pulse">Loading...</div>;
  }

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => router.push(tab.path)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative
                  ${currentPath === tab.path 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }
                `}
              >
                {React.cloneElement(tab.icon as React.ReactElement<any>, { className: "h-4 w-4" })}
                {tab.label}
                {currentPath === tab.path && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4 text-zinc-500">
            <Users className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Fellowship Administrators</h2>
          <p className="text-zinc-500 max-w-md mx-auto mb-6">
            The ability to view and manage staff/administrators specific to this fellowship will be available soon.
          </p>
          <Button variant="outline" onClick={() => router.push('/settings/staff')}>
            Manage All Staff
          </Button>
        </div>
      </div>
    </>
  );
}
