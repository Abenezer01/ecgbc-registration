"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, Users, FileText, User, Search } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useFellowship } from "@/hooks/useFellowships";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";

export default function FellowshipMembersPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: fellowship, isLoading: isFellowshipLoading } = useFellowship(id);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const { data: membersData, isLoading: isMembersLoading } = useMembers({ 
    councilFellowshipId: id,
    search: searchTerm,
    page: page,
    pageSize: 10
  });

  const { hasPermission } = useAuth();
  const canViewReports = hasPermission("report_view") || hasPermission("member_view");
  const canManageUsers = hasPermission("church_user_view") || hasPermission("member_view");

  const tabs = [
    { id: "overview", label: "Overview", icon: <User />, path: `/fellowships/${id}/overview` },
    { id: "members", label: "Members", icon: <Building2 />, path: `/fellowships/${id}/members` },
    { id: "reports", label: "Reports", icon: <FileText />, path: `/fellowships/${id}/reports`, visible: canViewReports },
    { id: "users", label: "Fellowship Users", icon: <Users />, path: `/fellowships/${id}/users`, visible: canManageUsers },
  ];

  const visibleTabs = tabs.filter(tab => tab.visible !== false);
  const currentPath = `/fellowships/${id}/members`;

  if (isFellowshipLoading) {
    return <div className="p-10 text-center animate-pulse">Loading...</div>;
  }

  const columns = [
    {
      key: "name",
      header: "Church / Member Name",
      cell: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">{row.name}</div>
            <div className="text-xs text-zinc-500">{row.phone || "No phone"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: any) => (
        <Badge variant={row.isActive ? "success" : "default"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "region",
      header: "Region / Zone",
      cell: (row: any) => (
        <span className="text-sm text-zinc-600">
          {row.region?.name || "N/A"} {row.zone ? `/ ${row.zone}` : ""}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right w-24",
      cell: (row: any) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push(`/members/${row.id}`)}
        >
          View
        </Button>
      ),
    }
  ];

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
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Member Churches</h2>
              <p className="text-sm text-zinc-500">
                {membersData?.total || 0} registered members under {fellowship?.name}
              </p>
            </div>
            
            <div className="w-full md:w-72 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search member churches..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          {isMembersLoading ? (
            <div className="py-12 text-center text-zinc-500 animate-pulse">Loading members...</div>
          ) : membersData?.members.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              No member churches found for this fellowship.
            </div>
          ) : (
            <>
              <DataTable columns={columns} data={membersData?.members || []} rowKey={(row) => row.id} />
              <div className="mt-4 flex justify-end">
                <Pagination 
                  page={page} 
                  pageSize={10} 
                  total={membersData?.total || 0} 
                  onPageChange={setPage} 
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
