"use client";

import React, { useState, useEffect, useRef } from "react";
import { FileText, Plus, Eye, Download, Calendar, FileDown, MoreVertical } from "lucide-react";
import { Badge, DataTable, Button, DateInput, Modal, ModalFooter, FormField, Input, RowActions, presets, Select } from "@/components/ui";
import { useMemberReports, useCreateMemberReport, useUpdateMemberReport, useDeleteMemberReport } from "@/hooks/useMemberReports";
import { usePaymentMethods, useVerifyPayment } from "@/hooks/useFinance";
import { useAuth } from "@/hooks/useAuth";
import { fileUrl } from "@/lib/file-url";
import { FileViewer } from "@/components/shared/FileViewer";

interface ReportsTabProps {
  member: any;
}

export function ReportsTab({ member }: ReportsTabProps) {
  const { hasPermission } = useAuth();
  const memberId = member.id;

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Form states
  const [year, setYear] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [bankSuffix, setBankSuffix] = useState("");
  const [reportedAt, setReportedAt] = useState("");
  const [remark, setRemark] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File Viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState<string | null>(null);

  // Queries & Mutations
  const { data: reports = [], isLoading, refetch } = useMemberReports(memberId);
  const { mutateAsync: createReport, isPending: creating } = useCreateMemberReport();
  const { mutateAsync: updateReport, isPending: updating } = useUpdateMemberReport();
  const { mutateAsync: deleteReport, isPending: deleting } = useDeleteMemberReport();
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

  const canAdd = hasPermission("add_report") || hasPermission("member_change");
  const canEdit = hasPermission("change_report") || hasPermission("member_change");
  const canDelete = hasPermission("delete_report") || hasPermission("member_change");

  const resetForm = () => {
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!year) {
      setError("Please specify the report year.");
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
    setYear(row.year?.toString() || "");
    setBankReference(row.bankReference || "");
    setBankSuffix("");
    setReportedAt(row.reportedAt ? row.reportedAt.split("T")[0] : "");
    setRemark(row.remark || "");
    setEditOpen(true);
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
      className: "text-right w-24",
      cell: (row: any) => (
        <div className="flex justify-end">
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Reports</p>
          <h4 className="text-base font-bold text-zinc-950 dark:text-white">Report Records</h4>
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
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
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

      {/* Add Report Modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); resetForm(); }} title="Add Annual Report" size="md">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField id="year" label="Report Year (E.C)" required>
              <Input
                id="year"
                type="number"
                placeholder="2016"
                value={year}
                onChange={(e) => setYear(e.target.value)}
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
            <FormField id="report-file" label="Upload Report Document (PDF)">
              <input
                id="report-file"
                type="file"
                accept=".pdf"
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
    </div>
  );
}
