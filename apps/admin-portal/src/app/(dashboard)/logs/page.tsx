"use client";

import React, { useState } from "react";
import { History, Search, RefreshCw, Eye, Filter, Download, Calendar } from "lucide-react";
import {
  PageHeader, Button, DateInput, Badge, DataTable, Pagination, Select, Modal, ModalFooter, FormField
} from "@/components/ui";
import type { Column } from "@/components/ui";
import { useActivityLogs, type ActivityLog } from "@/hooks/useActivityLogs";
import { useAuth } from "@/hooks/useAuth";

const PAGE_SIZE = 20;

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  LOGIN: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  LOGOUT: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  PASSWORD_CHANGE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  PASSWORD_RESET: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  MEMBER: <History className="h-4 w-4 text-blue-500" />,
  REPORT: <FileInput className="h-4 w-4 text-emerald-500" />,
  DATA_LOOKUP: <Filter className="h-4 w-4 text-purple-500" />,
  CHURCH_USER: <UserCheck className="h-4 w-4 text-indigo-500" />,
  STAFF: <ShieldCheck className="h-4 w-4 text-rose-500" />,
};

function FileInput(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function UserCheck(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function ActivityLogsPage() {
  const { hasPermission } = useAuth();
  
  // Permission check
  if (!hasPermission("view_logs")) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ShieldCheck className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You don't have permission to view activity logs.
          </p>
        </div>
      </div>
    );
  }
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Inspect log modal details
  const [activeDetailLog, setActiveDetailLog] = useState<ActivityLog | null>(null);

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__logsSearchTimer);
    (window as any).__logsSearchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 350);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log("Export functionality to be implemented");
  };

  const { data, isLoading, refetch, isFetching } = useActivityLogs({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
    entity: entityFilter !== "all" ? entityFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;

  const COLUMNS: Column<ActivityLog>[] = [
    {
      key: "time",
      header: "Timestamp",
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
        <Badge className={ACTION_COLORS[row.action] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"}>
          {row.action}
        </Badge>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      cell: (row) => (
        <div className="flex items-center gap-2">
          {ENTITY_ICONS[row.entity] || <History className="h-4 w-4 text-zinc-400" />}
          <span className="text-xs font-semibold capitalize font-mono text-zinc-700 dark:text-zinc-300">
            {row.entity.replace('_', ' ')}
          </span>
        </div>
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
            <p className="text-[10px] text-zinc-500">{row.performerEmail}</p>
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
    <div className="space-y-6">
      <PageHeader
        title="Activity Logs"
        description="Track all system activities including create, update, delete operations and user actions."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleExport} aria-label="Export logs">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {/* Filter Ribbon */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <Input
              placeholder="Search logs..."
              className="pl-9"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="PASSWORD_CHANGE">Password Change</option>
            <option value="PASSWORD_RESET">Password Reset</option>
          </Select>
          <Select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Entities</option>
            <option value="MEMBER">Member</option>
            <option value="REPORT">Report</option>
            <option value="DATA_LOOKUP">Data Lookup</option>
            <option value="CHURCH_USER">Church User</option>
            <option value="STAFF">Staff</option>
          </Select>
          <DateInput
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
          <DateInput
            placeholder="End Date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <DataTable<ActivityLog>
        columns={COLUMNS}
        data={logs}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        emptyTitle="No activity logs found"
        emptyDescription="Activity records will appear here as users perform actions in the system."
      />

      {total > PAGE_SIZE && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={handlePageChange} />
      )}

      {/* Detailed Log inspector */}
      {activeDetailLog && (
        <Modal
          open={!!activeDetailLog}
          onClose={() => setActiveDetailLog(null)}
          title="Activity Log Details"
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField id="l-time" label="Timestamp">
                <Input id="l-time" value={new Date(activeDetailLog.createdAt).toLocaleString()} readOnly />
              </FormField>
              <FormField id="l-action" label="Action">
                <Input id="l-action" value={activeDetailLog.action} readOnly />
              </FormField>
            </div>
            
            <FormField id="l-entity" label="Entity">
              <Input id="l-entity" className="capitalize" value={activeDetailLog.entity.replace('_', ' ')} readOnly />
            </FormField>

            <FormField id="l-description" label="Description">
              <Input id="l-description" value={activeDetailLog.description || "-"} readOnly />
            </FormField>

            {activeDetailLog.performerName && (
              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Performed By</p>
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {activeDetailLog.performerName}
                </p>
                <p className="text-xs text-zinc-500">{activeDetailLog.performerEmail}</p>
                <Badge variant="outline" className="text-[10px]">
                  {activeDetailLog.performedByType}
                </Badge>
              </div>
            )}

            {activeDetailLog.metadata && (
              <FormField id="l-metadata" label="Metadata">
                <textarea
                  id="l-metadata"
                  value={JSON.stringify(activeDetailLog.metadata, null, 2)}
                  readOnly
                  className="w-full h-32 text-xs font-mono p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
                />
              </FormField>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs text-zinc-400">
              <div>IP Address: {activeDetailLog.ipAddress || "N/A"}</div>
              <div className="truncate">User Agent: {activeDetailLog.userAgent || "N/A"}</div>
            </div>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setActiveDetailLog(null)}>Close</Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
