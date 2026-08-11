"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, Plus, Eye, Download, Calendar, FileDown, User, FolderOpen, Users, ShieldAlert, DollarSign } from "lucide-react";
import { Badge, DataTable, Button, DateInput, Modal, ModalFooter, FormField, RowActions, presets, Input } from "@/components/ui";
import { useMemberReports, useCreateMemberReport, useUpdateMemberReport, useDeleteMemberReport } from "@/hooks/useMemberReports";
import { useReportRequests } from "@/hooks/useReportRequests";
import { useAuth } from "@/hooks/useAuth";
import { fileUrl } from "@/lib/file-url";
import { FileViewer } from "@/components/shared/FileViewer";
import { useMember } from "@/hooks/useMembers";
import { useGenerateFee, useFeePreview, usePaymentMethods, useVerifyPayment } from "@/hooks/useFinance";
import { GenerateFeeDialog } from "@/components/finance/GenerateFeeDialog";
import { FeeStatusBadge } from "@/components/finance/FeeStatusBadge";
import { Select } from "@/components/ui";

export default function ReportsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: member, isLoading: memberLoading } = useMember(id);
  const { hasPermission } = useAuth();
  const memberId = id;

  const canViewFiles = hasPermission("view_file") || hasPermission("view_member");
  const canViewReports = hasPermission("view_report") || hasPermission("view_member");
  const canManageUsers = hasPermission("view_church_user") || hasPermission("view_member");
  const canDeactivate = hasPermission("deactivate_member") || hasPermission("delete_member");

  const tabs = [
    { id: "overview", label: "Overview", icon: <User />, path: `/members/${id}/overview` },
    { id: "reports", label: "Reports", icon: <FileText />, path: `/members/${id}/reports`, visible: canViewReports },
    { id: "documents", label: "Documents", icon: <FolderOpen />, path: `/members/${id}/documents`, visible: canViewFiles },
    { id: "church-users", label: "Church Users", icon: <Users />, path: `/members/${id}/church-users`, visible: canManageUsers },
    { id: "settings", label: "Settings", icon: <ShieldAlert />, path: `/members/${id}/settings`, visible: canDeactivate },
  ];

  const visibleTabs = tabs.filter(tab => tab.visible !== false);
  const currentPath = `/members/${id}/reports`;

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Form states
  const [reportRequestId, setReportRequestId] = useState("");
  const [year, setYear] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [bankSuffix, setBankSuffix] = useState("");
  const [reportedAt, setReportedAt] = useState("");
  const [remark, setRemark] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Report Requests (active only)
  const { data: requestsData } = useReportRequests(1, 100);
  const activeRequests = (requestsData?.requests ?? []).filter((r) => r.isActive);

  // File Viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState<string | null>(null);

  // Queries & Mutations
  const { data: reports = [], isLoading, refetch } = useMemberReports(memberId);
  const { mutateAsync: createReport, isPending: creating } = useCreateMemberReport();
  const { mutateAsync: updateReport, isPending: updating } = useUpdateMemberReport();
  const { mutateAsync: deleteReport, isPending: deleting } = useDeleteMemberReport();
  const { mutateAsync: generateFee, isPending: generatingFee } = useGenerateFee();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { mutateAsync: verifyPayment } = useVerifyPayment();

  // Auto-verification state
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [verificationMsg, setVerificationMsg] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!bankReference.trim()) {
      setVerificationStatus("idle");
      setVerificationMsg("");
      return;
    }
    setVerificationStatus("verifying");
    setVerificationMsg("");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const result = await verifyPayment({ reference: bankReference.trim() });
        setVerificationStatus("success");
        setVerificationMsg(`Verified — ETB ${Number(result.amount).toLocaleString()}${result.payerName ? ` · ${result.payerName}` : ""}`);
      } catch (err: any) {
        setVerificationStatus("error");
        setVerificationMsg(err.response?.data?.message || "Could not verify reference. Check and try again.");
      }
    }, 1500);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [bankReference, bankSuffix]);

  const { data: feePreview, isLoading: feePreviewLoading } = useFeePreview(memberId, reportRequestId);

  const [genFeeOpen, setGenFeeOpen] = useState(false);
  const [selectedReportIdForFee, setSelectedReportIdForFee] = useState<string | null>(null);

  const canAdd = hasPermission("add_report") || hasPermission("member_change");
  const canEdit = hasPermission("change_report") || hasPermission("member_change");
  const canDelete = hasPermission("delete_report") || hasPermission("member_change");

  const resetForm = () => {
    setReportRequestId("");
    setYear("");
    setBankReference("");
    setBankSuffix("");
    setReportedAt("");
    setRemark("");
    setReportFile(null);
    setError(null);
    setVerificationStatus("idle");
    setVerificationMsg("");
  };

  const handleReportRequestChange = (id: string) => {
    setReportRequestId(id);
    const req = activeRequests.find((r) => r.id === id);
    if (req) setYear(String(req.year));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportRequestId) {
      setError("Please select a report request.");
      return;
    }
    if (!reportFile) {
      setError("A scanned report file (PDF) is required.");
      return;
    }
    if (!bankReference.trim()) {
      setError("Bank Reference is required.");
      return;
    }
    if (verificationStatus !== "success") {
      setError(verificationStatus === "verifying" ? "Please wait — verifying payment..." : verificationMsg || "Payment verification failed. Please correct the bank reference.");
      return;
    }
    try {
      await createReport({
        memberId,
        year: Number(year),
        reportRequestId,
        bankReference: bankReference || undefined,
        bankSuffix: bankSuffix || undefined,
        reportedAt: reportedAt || undefined,
        remark: remark || undefined,
        report: reportFile || undefined,
      });
      setAddOpen(false);
      resetForm();
      refetch();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create report.");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    if (!bankReference.trim()) {
      setError("Bank Reference is required.");
      return;
    }
    if (verificationStatus !== "success") {
      setError(verificationStatus === "verifying" ? "Please wait — verifying payment..." : verificationMsg || "Payment verification failed. Please correct the bank reference.");
      return;
    }
    try {
      await updateReport({
        reportId: selectedReport.id,
        memberId,
        bankReference: bankReference || undefined,
        bankSuffix: bankSuffix || undefined,
        reportedAt: reportedAt || undefined,
        remark: remark || undefined,
        report: reportFile || undefined,
      });
      setEditOpen(false);
      setSelectedReport(null);
      resetForm();
      refetch();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update report.");
    }
  };

  const handleDelete = async (reportId: string) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await deleteReport({ reportId, memberId });
        refetch();
      } catch {}
    }
  };

  const handleDownload = (fileName: string, relativeUrl: string) => {
    const link = document.createElement("a");
    link.href = fileUrl("report", relativeUrl);
    link.download = fileName || "report";
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

  const openEditFlow = (row: any) => {
    setSelectedReport(row);
    setBankReference(row.bankReference || "");
    setBankSuffix(row.bankSuffix || "");
    setYear(row.year?.toString() || "");
    setReportedAt(row.reportedAt ? row.reportedAt.split("T")[0] : "");
    setRemark(row.remark || "");
    setEditOpen(true);
  };

  const handleGenerateFee = async (reportId: string) => {
    try {
      await generateFee({ reportId });
      setGenFeeOpen(false);
      refetch(); // Reload reports to show new fee status
      router.push("/finance/fees"); // optionally redirect to fees
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate fee.");
      alert(err.response?.data?.message || "Failed to generate fee.");
    }
  };

  const columns = [
    {
      key: "year",
      header: "Report Year",
      cell: (row: any) => <span className="font-semibold text-zinc-950 dark:text-white">{row.year} E.C</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row: any) => (
        <Badge variant={row.status?.value === "submitted" ? "success" : "warning"}>
          {row.status?.description || row.status?.value || "Unknown"}
        </Badge>
      ),
    },
    {
      key: "feeStatus",
      header: "Fee",
      cell: (row: any) => {
        if (!row.reportingFee) {
          return <span className="text-zinc-400 text-xs">—</span>;
        }
        return <FeeStatusBadge status={row.reportingFee.status} />;
      },
    },
    {
      key: "bankReference",
      header: "Bank Reference",
      cell: (row: any) => <span className="text-zinc-500 font-mono text-xs font-semibold">{row.bankReference || "—"}</span>,
    },
    {
      key: "crv",
      header: "CRV",
      cell: (row: any) => {
        if (!row.reportingFee?.crv) return <span className="text-zinc-400 text-xs">—</span>;
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">{row.reportingFee.crv}</span>;
      }
    },
    {
      key: "reportedAt",
      header: "Reported Date",
      cell: (row: any) => (
        <span className="text-zinc-500 text-xs">
          {row.reportedAt ? new Date(row.reportedAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "file",
      header: "Attachment",
      cell: (row: any) => {
        if (row.file) {
          return (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleDownload(`${row.year}-report`, row.file)}
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
              >
                <FileDown className="h-3.5 w-3.5" /> Download
              </Button>
              <Button
                onClick={() => triggerViewer(row.file, `${row.year}-report.pdf`)}
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 text-blue-600 border-blue-100 hover:bg-blue-50"
              >
                <Eye className="h-3.5 w-3.5" /> View
              </Button>
            </div>
          );
        }
        return (
          <div className="text-xs text-zinc-400 font-medium">No Attachment</div>
        );
      },
    },
    ...(canEdit || canDelete ? [{
      key: "actions",
      header: "",
      className: "text-right w-40",
      cell: (row: any) => (
        <div className="flex justify-end gap-2">
          {!row.reportingFee && row.status?.value === "submitted" && (
            <Button
              onClick={() => {
                setSelectedReportIdForFee(row.id);
                setGenFeeOpen(true);
              }}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              title="Generate Fee"
            >
              <DollarSign className="h-3.5 w-3.5" />
            </Button>
          )}
          <RowActions
            actions={[
              presets.edit({ onClick: () => openEditFlow(row), allowed: canEdit }),
              presets.delete({
                onClick: () => handleDelete(row.id),
                allowed: canDelete,
                confirm: "Delete this report? This cannot be undone.",
              }),
            ]}
          />
        </div>
      ),
    }] : []),
  ];

  if (memberLoading) {
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
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Annual Reports</h2>
                <p className="text-sm text-zinc-500">{reports.length} report{reports.length !== 1 ? "s" : ""}</p>
              </div>
              {canAdd && (
                <Button onClick={() => setAddOpen(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add Report
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-16 text-zinc-500 animate-pulse">Loading reports history...</div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">No Annual Reports</h3>
                <p className="text-sm text-zinc-500 max-w-sm">
                  This member has not submitted any annual compliance reports yet.
                </p>
              </div>
            ) : (
              <DataTable columns={columns} data={reports} rowKey={(row) => row.id} />
            )}
          </div>
        </div>

        {/* Add Report Modal */}
        <Modal open={addOpen} onClose={() => { setAddOpen(false); resetForm(); }} title="Log Manual Report" size="md">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}
            <FormField id="reportRequest" label="Report Request" required>
              <Select
                id="reportRequest"
                value={reportRequestId}
                onChange={(e) => handleReportRequestChange(e.target.value)}
                required
              >
                <option value="">— Select a report request —</option>
                {activeRequests.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.title} ({req.year} E.C)
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Fee Preview UI */}
            {reportRequestId && (
              <div className="mt-2 mb-4">
                {feePreviewLoading ? (
                  <div className="text-xs text-zinc-500 animate-pulse">Calculating expected fee...</div>
                ) : feePreview ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm text-emerald-900">Expected Fee Amount</span>
                      <span className="font-bold text-lg text-emerald-700">
                        {feePreview.amount} {feePreview.currency}
                      </span>
                    </div>
                    {feePreview.feeMode === "MANUAL" ? (
                      <p className="text-xs text-emerald-800">
                        This request is configured for MANUAL fee assessment. Fee will be calculated later.
                      </p>
                    ) : (
                      <p className="text-xs text-emerald-800">
                        Based on the member's category and rules. A fee record will be generated automatically upon submission.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                    <p className="text-xs text-orange-800 font-medium">No matching fee rule found for this member.</p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField id="year" label="Report Year (E.C)">
                <Input
                  id="year"
                  type="number"
                  placeholder="Auto-filled"
                  value={year}
                  disabled
                  className="bg-zinc-50 dark:bg-zinc-800"
                />
              </FormField>
              <FormField id="reportedAt" label="Reported Date">
                <DateInput
                  id="reportedAt"
                  value={reportedAt}
                  onChange={(e) => setReportedAt(e.target.value)}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField id="bankSuffix" label="Payment Method (Bank)">
                <Select
                  value={bankSuffix}
                  onChange={(e) => setBankSuffix(e.target.value)}
                >
                  <option value="">Select Bank...</option>
                  {paymentMethods.filter(m => m.config?.isEnabled).map(m => (
                    <option key={m.value} value={m.value}>{m.description}</option>
                  ))}
                </Select>
              </FormField>
              <FormField id="bankReference" label="Bank Reference #" required>
                <Input
                  id="bankReference"
                  placeholder="Bank reference code"
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                  required
                />
                {bankReference && (
                  <div className={`text-xs mt-1 font-medium ${verificationStatus === 'success' ? 'text-green-600' : verificationStatus === 'error' ? 'text-red-500' : 'text-neutral-500'}`}>
                    {verificationStatus === 'verifying' ? 'Verifying...' : verificationMsg}
                  </div>
                )}
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <FormField id="remark" label="Remarks/Comment">
                <Input
                  id="remark"
                  placeholder="Remarks..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
              </FormField>
              <FormField id="report-file" label="Upload Report Document (PDF)" required>
                <input
                  id="report-file"
                  type="file"
                  accept=".pdf"
                  required
                  onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                  className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg p-2"
                />
              </FormField>
            </div>
            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => { setAddOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating ? "Saving..." : "Save Report"}</Button>
            </ModalFooter>
          </form>
        </Modal>

      {/* Edit Report Modal */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); resetForm(); }} title="Edit Annual Report" size="md">
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField id="year-edit" label="Report Year">
              <Input id="year-edit" type="number" value={selectedReport?.year || ""} disabled />
            </FormField>
            <FormField id="reportedAt-edit" label="Reported Date">
              <DateInput
                id="reportedAt-edit"
                value={reportedAt}
                onChange={(e) => setReportedAt(e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField id="bankSuffix-edit" label="Payment Method (Bank)">
              <Select
                value={bankSuffix}
                onChange={(e) => setBankSuffix(e.target.value)}
              >
                <option value="">Select Bank...</option>
                {paymentMethods.filter(m => m.config?.isEnabled).map(m => (
                  <option key={m.value} value={m.value}>{m.description}</option>
                ))}
              </Select>
            </FormField>
              <FormField id="bankReference-edit" label="Bank Reference #" required>
                <Input
                  id="bankReference-edit"
                  placeholder="Bank reference code"
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                  required
                />
                {bankReference && (
                  <div className={`text-xs mt-1 font-medium ${verificationStatus === 'success' ? 'text-green-600' : verificationStatus === 'error' ? 'text-red-500' : 'text-neutral-500'}`}>
                    {verificationStatus === 'verifying' ? 'Verifying...' : verificationMsg}
                  </div>
                )}
              </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <FormField id="remark-edit" label="Remarks/Comment">
              <Input
                id="remark-edit"
                placeholder="Remarks..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </FormField>
            <FormField id="report-file-edit" label="Replace Report Document (PDF)">
              <input
                id="report-file-edit"
                type="file"
                accept=".pdf"
                onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg p-2"
              />
            </FormField>
          </div>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => { setEditOpen(false); resetForm(); }}>Cancel</Button>
            <Button type="submit" disabled={updating}>{updating ? "Updating..." : "Update Report"}</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* File Viewer Modal */}
      {viewerOpen && (
        <FileViewer
          open={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setViewerUrl(null);
            setViewerName(null);
          }}
          fileUrl={viewerUrl}
          fileName={viewerName}
        />
      )}

      {/* Generate Fee Modal */}
      <GenerateFeeDialog
        open={genFeeOpen}
        onClose={() => {
          setGenFeeOpen(false);
          setSelectedReportIdForFee(null);
        }}
        reportId={selectedReportIdForFee}
        onConfirm={handleGenerateFee}
        isPending={generatingFee}
      />
    </>
  );
}
