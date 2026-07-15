"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, User, FileText, FolderOpen, Users, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui";
import { useMember } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: member, isLoading } = useMember(id);
  const { hasPermission } = useAuth();

  const canViewFiles = hasPermission("file_view") || hasPermission("member_view");
  const canViewReports = hasPermission("report_view") || hasPermission("member_view");
  const canManageUsers = hasPermission("church_user_view") || hasPermission("member_view");
  const canDeactivate = hasPermission("member_deactivate") || hasPermission("member_delete");

  const tabs = [
    { id: "overview", label: "Overview", icon: <User />, path: `/members/${id}/overview` },
    { id: "reports", label: "Reports", icon: <FileText />, path: `/members/${id}/reports`, visible: canViewReports },
    { id: "documents", label: "Documents", icon: <FolderOpen />, path: `/members/${id}/documents`, visible: canViewFiles },
    { id: "church-users", label: "Church Users", icon: <Users />, path: `/members/${id}/church-users`, visible: canManageUsers },
    { id: "settings", label: "Settings", icon: <ShieldAlert />, path: `/members/${id}/settings`, visible: canDeactivate },
  ];

  const visibleTabs = tabs.filter(tab => tab.visible !== false);
  const currentPath = `/members/${id}/settings`;

  if (isLoading) {
    return <div className="p-10 text-center animate-pulse">Loading...</div>;
  }

  if (!member) {
    return (
      <div className="p-10 text-center text-zinc-500">
        Member not found.
      </div>
    );
  }

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
        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
            
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </h2>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-6 max-w-xl">
              Deactivating this member will prevent them from accessing any services and will mark their status as inactive across the entire system. This action can be reversed by a super administrator.
            </p>
            
            <div className="flex items-center gap-4">
              <Button variant="danger" className="font-semibold shadow-sm shadow-red-200 dark:shadow-none">
                Deactivate Member
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
