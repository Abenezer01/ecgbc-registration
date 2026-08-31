
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, History, RefreshCw, AlertTriangle, User, FileText, FolderOpen, Users as UsersIcon, ShieldAlert } from "lucide-react";
import { Button, DataTable, Badge, Modal, FormField, Pagination } from "@/components/ui";
import type { Column } from "@/components/ui";
import { useMember } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLogs, type ActivityLog } from "@/hooks/useActivityLogs";
import { useDocumentCompleteness } from "@/hooks/useDocumentCompleteness";
import ActionStateDrawer from "@/components/action-state/ActionStateDrawer";

const PAGE_SIZE = 20;

export default function MemberHistoryPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const { data: member, isLoading: memberLoading } = useMember(id);
  const { data: documentCompleteness } = useDocumentCompleteness(id);
  const { hasPermission } = useAuth();
  
  const [page, setPage] = useState(1);
  const [activeDetailLog, setActiveDetailLog] = useState<ActivityLog | null>(null);

  const canViewFiles = hasPermission("view_file") || hasPermission("view_member");
  const canViewReports = hasPermission("view_report") || hasPermission("view_member");
  const canManageUsers = hasPermission("view_church_user") || hasPermission("view_member");
  const canDeactivate = hasPermission("deactivate_member") || hasPermission("delete_member");

  const tabs = [
    { id: "overview", label: "Overview", icon: <User />, path: `/members/${id}/overview` },
    { id: "reports", label: "Reports", icon: <FileText />, path: `/members/${id}/reports`, visible: canViewReports },
    { id: "documents", label: "Documents", icon: <FolderOpen />, path: `/members/${id}/documents`, visible: canViewFiles },
    { id: "church-users", label: "Church Users", icon: <UsersIcon />, path: `/members/${id}/church-users`, visible: canManageUsers },
    { id: "history", label: "History", icon: <History />, path: `/members/${id}/history` },
    { id: "settings", label: "Settings", icon: <ShieldAlert />, path: `/members/${id}/settings`, visible: canDeactivate },
  ];

  const visibleTabs = tabs.filter(tab => tab.visible !== false);
  const currentPath = `/members/${id}/history`;

  const { data, isLoading, isFetching, refetch } = useActivityLogs({
    page,
    limit: PAGE_SIZE,
    entity: "MEMBER",
    entityId: id,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;

  if (memberLoading) return <div className="p-10 text-center animate-pulse">Loading history...</div>;
  if (!member) return <div className="p-10 text-center text-zinc-500">Member not found.</div>;

  const COLUMNS: Column<ActivityLog>[] = [
    {
      key: "time",
      header: "Date & Time",
      cell: (row) => (
        <span className="text-xs text-zinc-500 font-mono">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <Badge className={row.action === "UPDATE" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : "bg-gray-100 text-gray-800"}>
          {row.action}
        </Badge>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => (
        <span className="text-sm text-zinc-900 dark:text-zinc-100">
          {row.description || "-"}
        </span>
      ),
    },
    {
      key: "performedBy",
      header: "Performed By",
      cell: (row) => {
        if (!row.performerName) return <span className="text-zinc-400 text-sm">System</span>;
        return (
          <div>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
              {row.performerName}
            </p>
            <Badge variant="outline" className="text-[10px] mt-1">
              {row.performedByType}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "inspect",
      header: "",
      className: "text-right w-16",
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveDetailLog(row)}
          className="h-8 w-8 p-0"
          title="Inspect log details"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      {documentCompleteness && !documentCompleteness.isComplete && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              {documentCompleteness.missingDocuments.length} required document missing
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => router.push(tab.path)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative ${currentPath === tab.path ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}
              >
                {React.cloneElement(tab.icon as React.ReactElement<any>, { className: "h-4 w-4" })}
                {tab.label}
                {currentPath === tab.path && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Action State Timeline */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-zinc-400" />
            Approval Status
          </h3>
          <ActionStateDrawer
            entityType="MEMBER"
            entityId={id}
            currentActionState={(member as any).currentActionState}
          />
        </div>

        {/* Data Table */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Activity & Change History</h3>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          
          <DataTable
            columns={COLUMNS}
            data={logs}
            isLoading={isLoading}
            emptyMessage="No activity logs found for this member."
          />
          {total > PAGE_SIZE && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(total / PAGE_SIZE)}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      <Modal open={!!activeDetailLog} onClose={() => setActiveDetailLog(null)} title="Activity Log Details" size="lg">
        {activeDetailLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Time</p>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                  {new Date(activeDetailLog.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Action</p>
                <Badge className={activeDetailLog.action === "UPDATE" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                  {activeDetailLog.action}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Performed By</p>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                  {activeDetailLog.performerName || "System"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-zinc-900 dark:text-zinc-100">
                  {activeDetailLog.description || "-"}
                </p>
              </div>
            </div>

            {activeDetailLog.metadata && activeDetailLog.metadata.changes && (
              <div>
                 <h4 className="text-sm font-semibold mb-2">Profile Changes</h4>
                 <div className="border rounded overflow-hidden text-sm">
                    <table className="w-full text-left">
                       <thead className="bg-gray-100">
                          <tr>
                             <th className="p-2 border-b">Field</th>
                             <th className="p-2 border-b">Old Value</th>
                             <th className="p-2 border-b">New Value</th>
                          </tr>
                       </thead>
                       <tbody>
                          {Object.entries(activeDetailLog.metadata.changes).map(([field, vals]: any) => (
                             <tr key={field} className="border-b last:border-b-0">
                                <td className="p-2 font-mono font-medium">{field}</td>
                                <td className="p-2 text-red-600 bg-red-50">{String(vals.old || "-")}</td>
                                <td className="p-2 text-green-600 bg-green-50">{String(vals.new || "-")}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            )}

            {activeDetailLog.metadata && !activeDetailLog.metadata.changes && (
              <FormField id="l-metadata" label="Raw Metadata">
                <textarea
                  id="l-metadata"
                  value={JSON.stringify(activeDetailLog.metadata, null, 2)}
                  readOnly
                  className="w-full h-32 text-xs font-mono p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
                />
              </FormField>
            )}
          </div>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={() => setActiveDetailLog(null)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
