"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Users, CheckCircle, AlertTriangle, Calendar, DollarSign, Search, Filter, Plus, Eye, FileDown, Pencil, Trash2, Send } from "lucide-react";
import { Card, CardContent, Button, Input, Pagination } from "@/components/ui";
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/utils";
import { useReportRequest } from "@/hooks/useReportRequest";
import { useGenerateMissingFees } from "@/hooks/useFeeRules";
import { useReportRequests, useUpdateReportRequest, useDeleteReportRequest } from "@/hooks/useReportRequests";
import toast from "react-hot-toast";

export default function ReportRequestDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"reported" | "not-reported">("reported");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFellowship, setFilterFellowship] = useState("");

  const { data, isLoading, error, refetch } = useReportRequest(id);
  const generateFeesMutation = useGenerateMissingFees();
  const updateRequestMutation = useUpdateReportRequest();
  const deleteRequestMutation = useDeleteReportRequest();

  const handleGenerateFees = async () => {
    if (confirm("This will auto-generate 'PENDING' reports and fees for all active members who haven't submitted yet. Are you sure?")) {
      try {
        const res = await generateFeesMutation.mutateAsync(id);
        toast.success(res.message || "Fees generated successfully");
        refetch();
      } catch (e: any) {
        toast.error(e.response?.data?.message || "Failed to generate fees");
      }
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this report request?")) {
      try {
        await deleteRequestMutation.mutateAsync(id);
        toast.success("Report request deleted successfully");
        router.push("/reports");
      } catch {
        toast.error("Failed to delete report request");
      }
    }
  };

  const filteredReported = data?.reported?.filter((r: any) => {
    const member = r.member || {};
    const matchesSearch = 
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.certificateNo?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFellowship = !filterFellowship || member.councilFellowshipId === filterFellowship;
    return matchesSearch && matchesFellowship;
  }) || [];

  const filteredNotReported = data?.notReported?.filter((m: any) => {
    const matchesSearch = 
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.certificateNo?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFellowship = !filterFellowship || m.councilFellowshipId === filterFellowship;
    return matchesSearch && matchesFellowship;
  }) || [];

  const totalMembers = (data?.reported?.length || 0) + (data?.notReported?.length || 0);
  const reportedCount = data?.reported?.length || 0;
  const notReportedCount = data?.notReported?.length || 0;
  const reportedPercentage = totalMembers > 0 ? Math.round((reportedCount / totalMembers) * 100) : 0;
  
  const paidFees = data?.reported?.filter((r: any) => r.reportingFee?.status === "PAID").length || 0;
  const feeCompletionRate = reportedCount > 0 ? Math.round((paidFees / reportedCount) * 100) : 0;

  const generatedExpectedAmount = data?.reported?.reduce((sum: number, r: any) => sum + Number(r.reportingFee?.amount || 0), 0) || 0;
  const potentialAdditionalRevenue = Number(data?.potentialAdditionalRevenue || 0);
  const totalExpectedAmount = generatedExpectedAmount + potentialAdditionalRevenue;
  
  const totalPaidAmount = data?.reported?.reduce((sum: number, r: any) => sum + (r.reportingFee?.status === "PAID" ? Number(r.reportingFee.amount) : 0), 0) || 0;
  
  const generatedPendingAmount = data?.reported?.reduce((sum: number, r: any) => sum + (r.reportingFee?.status !== "PAID" ? Number(r.reportingFee?.amount || 0) : 0), 0) || 0;
  const totalPendingAmount = generatedPendingAmount + potentialAdditionalRevenue;

  if (isLoading) {
    return (
      <div className="p-10 text-center animate-pulse">
        <div className="text-zinc-500">Loading report request details...</div>
      </div>
    );
  }

  if (error || !data?.request) {
    return (
      <div className="p-10 text-center text-zinc-500">
        <div className="mb-4">Report request not found.</div>
        <Button onClick={() => router.push("/reports")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Reports
        </Button>
      </div>
    );
  }

  const request = data.request;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push("/reports")}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {request.title}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {request.description || "No description provided"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {request.isActive ? (
            <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
              Active
            </span>
          ) : (
            <span className="text-xs px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full font-medium">
              Closed
            </span>
          )}
          {request.feeMode === "AUTO" && (
            <Button
              onClick={handleGenerateFees}
              variant="outline"
              size="sm"
              className="gap-2 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
              disabled={generateFeesMutation.isPending}
            >
              <DollarSign className="h-4 w-4" /> Generate Fees
            </Button>
          )}
          <Button
            onClick={() => router.push(`/reports/${id}/edit`)}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button
            onClick={handleDelete}
            variant="ghost"
            size="sm"
            className="gap-2 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-1">
              <Calendar className="h-4 w-4" />
              Reporting Year
            </div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              {request.year}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-1">
              <Calendar className="h-4 w-4" />
              Due Date
            </div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              {new Date(request.dueDate).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-1">
              <FileText className="h-4 w-4" />
              Fee Mode
            </div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              {request.feeMode === "AUTO" ? "Auto (Fee Rules)" : request.feeMode === "MANUAL" ? "Manual" : "None"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Total Members</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatNumber(totalMembers)}
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Reported</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatNumber(reportedCount)}
                  <span className="text-sm font-normal text-zinc-500 ml-1">
                    ({formatPercentage(reportedCount / totalMembers)})
                  </span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Not Reported</div>
                <div className="text-2xl font-bold text-amber-600">
                  {formatNumber(notReportedCount)}
                  <span className="text-sm font-normal text-zinc-500 ml-1">
                    ({formatPercentage(notReportedCount / totalMembers)})
                  </span>
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Fee Completion</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatPercentage(feeCompletionRate / 100)}
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Expected Revenue</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalExpectedAmount)}
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Collected Revenue</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(totalPaidAmount)}
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Pending Revenue</div>
                <div className="text-2xl font-bold text-amber-600">
                  {formatCurrency(totalPendingAmount)}
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("reported")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === "reported"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              Reported ({reportedCount})
              {activeTab === "reported" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("not-reported")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === "not-reported"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              Not Reported ({notReportedCount})
              {activeTab === "not-reported" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:text-blue-400" />
              )}
            </button>
          </nav>
        </div>

        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search by name or certificate number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-400" />
            <select
              value={filterFellowship}
              onChange={(e) => setFilterFellowship(e.target.value)}
              className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Fellowships</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "reported" ? (
            <ReportedMembersTable members={filteredReported} />
          ) : (
            <NotReportedMembersTable members={filteredNotReported} reportRequestId={id} />
          )}
        </div>
      </div>
    </div>
  );
}

function ReportedMembersTable({ members }: { members: any[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  if (members.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <FileText className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
        <p className="text-zinc-500 text-sm">No reports submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
            <th className="pb-3 font-medium">Member</th>
            <th className="pb-3 font-medium">Certificate #</th>
            <th className="pb-3 font-medium">Year</th>
            <th className="pb-3 font-medium">Fee Status</th>
            <th className="pb-3 font-medium">Amount</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {members.slice((page - 1) * pageSize, page * pageSize).map((r: any) => (
            <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <td className="py-4">
                <button
                  onClick={() => router.push(`/members/${r.member?.id}/overview`)}
                  className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {r.member?.name || "Unknown"}
                </button>
              </td>
              <td className="py-4 text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                {r.member?.certificateNo || "—"}
              </td>
              <td className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {r.year}
              </td>
              <td className="py-4">
                {r.reportingFee ? (
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      r.reportingFee.status === "PAID"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.reportingFee.status === "SENT"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.reportingFee.status}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400">—</span>
                )}
              </td>
              <td className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {r.reportingFee
                  ? formatCurrency(r.reportingFee.amount, r.reportingFee.currency)
                  : "—"}
              </td>
              <td className="py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => router.push(`/members/${r.member?.id}/reports`)}
                  >
                    <Eye className="h-4 w-4 text-zinc-500" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {members.length > pageSize && (
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={members.length}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

function NotReportedMembersTable({ members, reportRequestId }: { members: any[]; reportRequestId: string }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  if (members.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <CheckCircle className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
        <p className="text-zinc-500 text-sm">All members have submitted their reports!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
            <th className="pb-3 font-medium">Member</th>
            <th className="pb-3 font-medium">Certificate #</th>
            <th className="pb-3 font-medium">Member Type</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {members.slice((page - 1) * pageSize, page * pageSize).map((m: any) => (
            <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <td className="py-4">
                <button
                  onClick={() => router.push(`/members/${m.id}/overview`)}
                  className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {m.name}
                </button>
              </td>
              <td className="py-4 text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                {m.certificateNo}
              </td>
              <td className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                  {m.typeId?.slice(0, 8) || "—"}
                </span>
              </td>
              <td className="py-4">
                {m.isActive ? (
                  <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                    Active
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full font-medium">
                    Inactive
                  </span>
                )}
              </td>
              <td className="py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => router.push(`/members/${m.id}/reports`)}
                  >
                    <Plus className="h-3 w-3" /> Create Report
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Send reminder"
                  >
                    <Send className="h-4 w-4 text-zinc-500" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {members.length > pageSize && (
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={members.length}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
