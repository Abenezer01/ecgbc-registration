"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Phone, Users, User, FileText, FolderOpen, ShieldAlert, AlertTriangle } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import { useMember } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentCompleteness } from "@/hooks/useDocumentCompleteness";

export default function OverviewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: member, isLoading } = useMember(id);
  const { data: documentCompleteness } = useDocumentCompleteness(id);
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
  const currentPath = `/members/${id}/overview`;

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

  const m = member as any;
  const boardMembers = m.boardMembers || [];

  return (
    <>
      {/* Document Warning */}
        {documentCompleteness && !documentCompleteness.isComplete && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                {documentCompleteness.missingDocuments.length} required document{documentCompleteness.missingDocuments.length > 1 ? 's' : ''} missing
              </p>
              <button
                onClick={() => router.push(`/members/${id}/documents`)}
                className="text-sm text-amber-700 dark:text-amber-300 hover:underline mt-1"
              >
                View Documents →
              </button>
            </div>
          </div>
        )}

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
        <div className="p-6">
          {boardMembers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-400" />
                Board Members
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {boardMembers.map((bm: any, idx: number) => (
                  <Card key={idx} className="bg-white dark:bg-zinc-900/50 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {bm.fullName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                          {bm.fullName}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 flex items-center gap-1.5">
                          <Phone className="h-3 w-3" />
                          {bm.phoneNumber || "No phone provided"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {boardMembers.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-500 text-sm">No board members found.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
