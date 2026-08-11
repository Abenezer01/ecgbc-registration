"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Eye, FileDown, Plus, Banknote, CheckCircle, Users, Clock, Activity, Building, ChevronRight } from "lucide-react";
import { DataTable, Button, Pagination, RowActions, presets, Input } from "@/components/ui";
import { useAllReports, GlobalReport, useReportSummary } from "@/hooks/useAllReports";
import { useReportRequests, useCreateReportRequest, useUpdateReportRequest, useDeleteReportRequest, ReportRequestData } from "@/hooks/useReportRequests";
import { useGenerateMissingFees } from "@/hooks/useFeeRules";
import { fileUrl } from "@/lib/file-url";
import { FileViewer } from "@/components/shared/FileViewer";
import { Modal } from "@/components/ui/Modal";
import { DateInput } from "@/components/ui";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"submissions" | "requests">("submissions");
  
  // -- Submissions State --
  const [page, setPage] = useState(1);
  const { data: reportsData, isLoading: reportsLoading } = useAllReports(page, 20);

  // -- Summary State --
  const { data: summaryData, isLoading: summaryLoading } = useReportSummary();

  // File Viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState<string | null>(null);

  const handleDownload = (fileName: string, relativeUrl: string) => {
    const link = document.createElement("a");
    link.href = fileUrl("report", relativeUrl);
    link.download = fileName || "file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerViewer = (relativeUrl: string, name: string) => {
    const fullUrl = fileUrl("report", relativeUrl);
    setViewerUrl(fullUrl);
    setViewerName(name);
    setViewerOpen(true);
  };

  // -- Requests State --
  const [requestsPage, setRequestsPage] = useState(1);
  const { data: requestsData, isLoading: requestsLoading } = useReportRequests(requestsPage, 20);
  
  const [isRequestModalOpen, setRequestModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ReportRequestData | null>(null);
  
  const createRequestMutation = useCreateReportRequest();
  const updateRequestMutation = useUpdateReportRequest();
  const deleteRequestMutation = useDeleteReportRequest();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [dueDate, setDueDate] = useState("");
  const [feeMode, setFeeMode] = useState("AUTO");
  const [isActive, setIsActive] = useState(true);

  const generateFeesMutation = useGenerateMissingFees();

  const openCreateModal = () => {
    setEditingRequest(null);
    setTitle("");
    setDescription("");
    setYear(new Date().getFullYear());
    setDueDate("");
    setFeeMode("AUTO");
    setIsActive(true);
    setRequestModalOpen(true);
  };

  const openEditModal = (req: ReportRequestData) => {
    setEditingRequest(req);
    setTitle(req.title);
    setDescription(req.description || "");
    setYear(req.year);
    setDueDate(req.dueDate.split("T")[0]);
    setFeeMode(req.feeMode || "AUTO");
    setIsActive(req.isActive);
    setRequestModalOpen(true);
  };

  const handleSaveRequest = async () => {
    if (!title || !year || !dueDate) {
      toast.error("Title, Year, and Due Date are required.");
      return;
    }

    try {
      const payload = {
        title,
        description,
        year: Number(year),
        dueDate: new Date(dueDate).toISOString(),
        feeMode,
        isActive
      };

      if (editingRequest) {
        await updateRequestMutation.mutateAsync({ id: editingRequest.id, ...payload });
        toast.success("Report Request updated successfully");
      } else {
        await createRequestMutation.mutateAsync(payload);
        toast.success("Report Request created successfully");
      }
      setRequestModalOpen(false);
    } catch (error) {
      toast.error("Failed to save report request");
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (confirm("Are you sure you want to delete this request?")) {
      try {
        await deleteRequestMutation.mutateAsync(id);
        toast.success("Deleted successfully");
      } catch {
        toast.error("Failed to delete");
      }
    }
  };

  const handleGenerateFees = async (id: string) => {
    if (confirm("This will auto-generate 'PENDING' reports and fees for all active members who haven't submitted yet. Are you sure?")) {
      try {
        const res = await generateFeesMutation.mutateAsync(id);
        toast.success(res.message || "Fees generated successfully");
      } catch (e: any) {
        toast.error(e.response?.data?.message || "Failed to generate fees");
      }
    }
  };

  const reportColumns = [
    {
      key: "member",
      header: "Member / Fellowship",
      cell: (row: GlobalReport) => (
        <span
          className="font-semibold text-zinc-900 cursor-pointer hover:underline"
          onClick={() => {
            if (row.member) {
              router.push(`/members/${row.member.id}/reports`);
            }
          }}
        >
          {row.member?.name || "Unknown"}
        </span>
      ),
    },
    {
      key: "year",
      header: "Year",
      cell: (row: GlobalReport) => <span className="font-medium text-zinc-900">{row.year}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row: GlobalReport) => (
        <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
          {row.status?.value || "REPORTED"}
        </span>
      ),
    },
    {
      key: "fee",
      header: "Fee Status",
      cell: (row: GlobalReport) => {
        if (!row.reportingFee) return <span className="text-xs text-neutral-400">—</span>;
        const s = row.reportingFee.status;
        if (s === "PAID") return <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">Paid</span>;
        if (s === "SENT") return <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">Invoiced</span>;
        return <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">Pending</span>;
      },
    },
    {
      key: "bankReference",
      header: "Bank Ref #",
      cell: (row: GlobalReport) => <span className="text-xs font-mono text-neutral-500">{row.bankReference || "—"}</span>,
    },
    {
      key: "crv",
      header: "CRV",
      cell: (row: GlobalReport) => {
        if (!row.reportingFee?.crv) return <span className="text-zinc-400 text-xs">—</span>;
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">{row.reportingFee.crv}</span>;
      }
    },
    {
      key: "file",
      header: "Attachment",
      cell: (row: GlobalReport) => {
        if (!row.file) return <span className="text-xs text-neutral-400 font-medium">No Attachment</span>;
        return (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => triggerViewer(row.file!, `${row.year}-report.pdf`)}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 text-blue-600 border-blue-100 hover:bg-blue-50"
            >
              <Eye className="h-3.5 w-3.5" /> View
            </Button>
            <Button
              onClick={() => handleDownload(`${row.year}-report`, row.file!)}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
            >
              <FileDown className="h-3.5 w-3.5" /> DL
            </Button>
          </div>
        );
      },
    },
  ];

  const requestColumns = [
    {
      key: "title",
      header: "Title",
      cell: (row: ReportRequestData) => (
        <div>
          <p
            className="font-medium text-zinc-900 cursor-pointer hover:underline"
            onClick={() => router.push(`/reports/${row.id}`)}
          >
            {row.title}
          </p>
          <p className="text-xs text-zinc-500">{row.description}</p>
        </div>
      ),
    },
    {
      key: "year",
      header: "Target Year",
      cell: (row: ReportRequestData) => <span className="font-medium">{row.year}</span>,
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (row: ReportRequestData) => (
        <span className="text-sm text-zinc-600">
          {new Date(row.dueDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (row: ReportRequestData) => (
        row.isActive 
          ? <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">Active</span>
          : <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full font-medium">Closed</span>
      ),
    },
    {
      key: "submissions",
      header: "Submissions",
      cell: (row: ReportRequestData) => (
        <span className="text-sm font-medium">{row._count?.reports || 0} received</span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row: ReportRequestData) => (
        <div className="flex items-center gap-2 justify-end">
          {row.feeMode === "AUTO" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerateFees(row.id)}
              className="h-8 text-xs bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
              disabled={generateFeesMutation.isPending}
            >
              Generate Fees
            </Button>
          )}
          <RowActions
            mode="menu"
            actions={[
              presets.edit({ onClick: () => openEditModal(row), allowed: true }),
              presets.delete({
                onClick: () => handleDeleteRequest(row.id),
                allowed: true,
                confirm: `Delete report request "${row.title}"?`,
              }),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Reports Management</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Manage report requests and view member submissions.
          </p>
        </div>
        {activeTab === "requests" && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" /> New Request
          </Button>
        )}
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Total Submissions</p>
            {summaryLoading ? (
              <div className="h-7 w-16 bg-zinc-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-zinc-900">{summaryData?.totalSubmissions || 0}</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Active Requests</p>
            {summaryLoading ? (
              <div className="h-7 w-16 bg-zinc-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-zinc-900">{summaryData?.activeRequests || 0}</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Banknote className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Fees Collected (ETB)</p>
            {summaryLoading ? (
              <div className="h-7 w-20 bg-zinc-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-zinc-900">
                {(summaryData?.feesCollected || 0).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Active Members</p>
            {summaryLoading ? (
              <div className="h-7 w-16 bg-zinc-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-zinc-900">{summaryData?.totalMembers || 0}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions by Status */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-zinc-500" />
            <h3 className="font-semibold text-zinc-900">Submissions by Status</h3>
          </div>
          {summaryLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-zinc-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : summaryData?.submissionsByStatus && summaryData.submissionsByStatus.length > 0 ? (
            <div className="space-y-4 flex-1">
              {summaryData.submissionsByStatus.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <span className="text-sm font-medium text-zinc-700">{s.status}</span>
                  <span className="text-sm font-bold text-zinc-900 bg-white px-2 py-1 rounded shadow-sm border border-zinc-200">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 py-4 text-center flex-1">No status data available.</p>
          )}
        </div>

        {/* Top Fellowships */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-5 w-5 text-zinc-500" />
            <h3 className="font-semibold text-zinc-900">Fellowship Submissions</h3>
          </div>
          {summaryLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-zinc-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : summaryData?.submissionsByFellowship && summaryData.submissionsByFellowship.length > 0 ? (
            <div className="space-y-4 flex-1">
              {summaryData.submissionsByFellowship.map((f, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-800 truncate mr-2" title={f.fellowship}>
                      {f.fellowship}
                    </span>
                    <span className="text-xs font-medium text-zinc-500">
                      {f.reported} / {f.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500" 
                        style={{ width: `${f.total > 0 ? (f.reported / f.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-zinc-500 shrink-0 w-12 text-right">
                      {f.notReported} pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 py-4 text-center flex-1">No fellowship data available.</p>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-zinc-500" />
              <h3 className="font-semibold text-zinc-900">Recent Submissions</h3>
            </div>
            <button 
              onClick={() => setActiveTab("submissions")}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              View All <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {summaryLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="h-10 w-10 bg-zinc-100 animate-pulse rounded-full shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-1/2 bg-zinc-100 animate-pulse rounded" />
                    <div className="h-3 w-1/3 bg-zinc-100 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : summaryData?.recentSubmissions && summaryData.recentSubmissions.length > 0 ? (
            <div className="space-y-3 flex-1">
              {summaryData.recentSubmissions.map((rs) => (
                <div key={rs.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                  <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {rs.member?.name || "Unknown Member"}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {rs.year} Report • {new Date(rs.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col gap-1 items-end">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {rs.status.value}
                    </span>
                    {rs.reportingFee?.status === "PAID" && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                        <Banknote className="h-3 w-3" /> Paid
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 py-4 text-center flex-1">No recent submissions.</p>
          )}
        </div>
      </div>

      <div className="flex space-x-1 bg-zinc-100/50 p-1 rounded-xl w-fit border border-zinc-200/50">
        <button
          onClick={() => setActiveTab("submissions")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "submissions"
              ? "bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200"
              : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
          }`}
        >
          Received Submissions
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "requests"
              ? "bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200"
              : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
          }`}
        >
          Report Requests
        </button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        {activeTab === "submissions" ? (
          <>
            <DataTable
              columns={reportColumns}
              data={reportsData?.reports || []}
              isLoading={reportsLoading}
              rowKey={(row) => row.id}
            />
            {reportsData && reportsData.total > 0 && (
              <div className="border-t border-zinc-200 p-4">
                <Pagination
                  page={page}
                  pageSize={20}
                  total={reportsData.total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <DataTable
              columns={requestColumns}
              data={requestsData?.requests || []}
              isLoading={requestsLoading}
              rowKey={(row) => row.id}
            />
            {requestsData && requestsData.total > 0 && (
              <div className="border-t border-zinc-200 p-4">
                <Pagination
                  page={requestsPage}
                  pageSize={20}
                  total={requestsData.total}
                  onPageChange={setRequestsPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Report Request Modal */}
      <Modal
        open={isRequestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title={editingRequest ? "Edit Report Request" : "New Report Request"}
        description="Specify the report members need to upload."
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. 2024 Annual Report" 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Instructions for members..." 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reporting Year *</Label>
              <Input 
                type="number" 
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <DateInput
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fee Generation Mode</Label>
            <select
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={feeMode}
              onChange={(e) => setFeeMode(e.target.value)}
            >
              <option value="AUTO">Auto (Use Fee Rules)</option>
              <option value="MANUAL">Manual (Admin sets amount later)</option>
              <option value="NONE">None (No fee required)</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label>Active Status</Label>
              <p className="text-xs text-zinc-500">Members can only see active requests.</p>
            </div>
            <Checkbox
              id="isActive"
              checked={isActive}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setRequestModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveRequest} disabled={createRequestMutation.isPending || updateRequestMutation.isPending}>
            Save Request
          </Button>
        </div>
      </Modal>

      <FileViewer 
        open={viewerOpen} 
        onClose={() => setViewerOpen(false)} 
        fileUrl={viewerUrl} 
        fileName={viewerName} 
      />
    </div>
  );
}
