"use client";

import React, { useState, useEffect, useRef } from "react";
import { FileText, Plus, Eye, FileDown, Clock, CheckCircle2, AlertCircle, Banknote } from "lucide-react";
import { DataTable, Button, Modal, ModalFooter, FormField, Input } from "@/components/ui";
import {
  usePortalReports,
  usePortalReportRequests,
  useCreatePortalReport,
  useFeePreview,
  usePaymentMethods,
  PaymentMethod,
  Report,
  PortalReportRequest,
  useVerifyPayment,
} from "@/hooks/usePortalReports";
import { useChurchProfile } from "@/hooks/useChurchProfile";
import { generateInvoicePDF, generateReceiptPDF } from "@/lib/pdf-generator";
import { fileUrl } from "@/lib/file-url";
import { FileViewer } from "@/components/shared/FileViewer";
import { Landmark, Smartphone } from "lucide-react";

export default function ReportsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [linkedRequest, setLinkedRequest] = useState<PortalReportRequest | null>(null);

  const [bankReference, setBankReference] = useState("");
  const [remark, setRemark] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState<string | null>(null);

  const { data: reports = [], isLoading: reportsLoading } = usePortalReports();
  const { data: reportRequests = [], isLoading: requestsLoading } = usePortalReportRequests();
  const { data: churchProfile } = useChurchProfile();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: feePreview, isLoading: feePreviewLoading } = useFeePreview(linkedRequest?.id);
  const { mutateAsync: createReport, isPending: creating } = useCreatePortalReport();
  const { mutateAsync: verifyPayment } = useVerifyPayment();

  // Auto-verification state
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [verificationMsg, setVerificationMsg] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-verify 3 seconds after user stops typing
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
        if (feePreview?.amount && Number(result.amount) !== Number(feePreview.amount)) {
          setVerificationStatus("error");
          setVerificationMsg(`Amount mismatch: receipt is ${result.amount} ETB but expected ${feePreview.amount} ETB.`);
        } else {
          setVerificationStatus("success");
          setVerificationMsg(`Verified — ETB ${Number(result.amount).toLocaleString()}${result.payerName ? ` · ${result.payerName}` : ""}`);
        }
      } catch (err: any) {
        setVerificationStatus("error");
        setVerificationMsg(err.response?.data?.message || "Could not verify reference. Check and try again.");
      }
    }, 3000);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [bankReference, feePreview?.amount]);

  const pendingRequests = reportRequests.filter((req) => req.reports.length === 0);
  const isLoading = reportsLoading || requestsLoading;

  const resetForm = () => {
    setBankReference("");
    setRemark("");
    setReportFile(null);
    setSelectedMethodId(null);
    setError(null);
    setVerificationStatus("idle");
    setVerificationMsg("");
  };

  const openSubmitModal = (req: PortalReportRequest | null = null) => {
    setLinkedRequest(req);
    resetForm();
    setAddOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Block if reference provided but verification hasn't passed
    if (bankReference.trim() && verificationStatus !== "success") {
      setError(verificationStatus === "verifying" ? "Please wait — verifying payment..." : verificationMsg || "Payment verification failed. Please correct the bank reference.");
      return;
    }
    try {
      await createReport({
        year: linkedRequest?.year ?? new Date().getFullYear(),
        bankReference: bankReference || undefined,
        remark: remark || undefined,
        report: reportFile || undefined,
        reportRequestId: linkedRequest?.id,
      });
      setAddOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit report.");
    }
  };

  const handleDownload = (fileName: string, relativeUrl: string) => {
    const link = document.createElement("a");
    link.href = fileUrl("report", relativeUrl);
    link.download = fileName || "file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerViewer = (relativeUrl: string, name: string) => {
    setViewerUrl(fileUrl("report", relativeUrl));
    setViewerName(name);
    setViewerOpen(true);
  };

  const isDueSoon = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 7;
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  const feeStatusBadge = (fee: Report["reportingFee"]) => {
    if (!fee) return null;
    if (fee.status === "PAID")
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
          <CheckCircle2 className="h-3 w-3" /> Paid
        </span>
      );
    if (fee.status === "SENT")
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
          <Banknote className="h-3 w-3" /> Invoiced
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
        <Clock className="h-3 w-3" /> Pending
      </span>
    );
  };

  const submittedColumns = [
    {
      key: "year",
      header: "Year",
      cell: (row: Report) => <span className="font-semibold">{row.year}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row: Report) => (
        <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
          {row.status?.value || "REPORTED"}
        </span>
      ),
    },
    {
      key: "reportedAt",
      header: "Submitted",
      cell: (row: Report) => (
        <span className="text-neutral-500 text-xs">
          {row.reportedAt ? new Date(row.reportedAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "fee",
      header: "Fee",
      cell: (row: Report) => {
        if (!row.reportingFee) return <span className="text-neutral-400 text-xs">—</span>;
        return (
          <div className="space-y-1">
            <p className="font-semibold text-zinc-900 text-sm">
              {row.reportingFee.currency}{" "}
              {Number(row.reportingFee.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            {feeStatusBadge(row.reportingFee)}
            {row.reportingFee.status !== "PAID" && (
              <p className="text-[10px] text-zinc-400 leading-tight">
                Please visit the finance office to complete payment.
              </p>
            )}
            {row.bankReference && (
              <p className="text-[10px] font-mono text-zinc-500">Ref: {row.bankReference}</p>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: Report) => (
        <div className="flex items-center gap-2">
          {row.file && (
            <>
              <Button
                onClick={() => handleDownload(`${row.year}-report`, row.file!)}
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
              >
                <FileDown className="h-3.5 w-3.5" /> Download
              </Button>
              <Button
                onClick={() => triggerViewer(row.file!, `${row.year}-report.pdf`)}
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 text-blue-600 border-blue-100 hover:bg-blue-50"
              >
                <Eye className="h-3.5 w-3.5" /> View
              </Button>
            </>
          )}
          {!row.file && (
            <span className="text-xs text-neutral-400 font-medium">No File</span>
          )}
          {row.reportingFee && row.reportingFee.status !== "PAID" && (
            <Button
              onClick={() => generateInvoicePDF(row, churchProfile)}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 text-emerald-600 border-emerald-100 hover:bg-emerald-50"
            >
              <FileDown className="h-3.5 w-3.5" /> Invoice
            </Button>
          )}
          {row.reportingFee && row.reportingFee.status === "PAID" && (
            <Button
              onClick={() => generateReceiptPDF(row, churchProfile)}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 text-blue-600 border-blue-100 hover:bg-blue-50"
            >
              <FileDown className="h-3.5 w-3.5" /> Receipt
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-2xl font-bold text-neutral-900">Annual Reports</h4>
          <p className="text-sm text-neutral-500">Submit reports as requested by the admin and track your submissions.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-neutral-500 animate-pulse">Loading...</div>
      ) : (
        <>
          {/* ─── Pending Requests ─── */}
          {pendingRequests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <h5 className="text-base font-semibold text-neutral-900">
                  Pending Requests ({pendingRequests.length})
                </h5>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pendingRequests.map((req) => {
                  const overdue = isOverdue(req.dueDate);
                  const soon = !overdue && isDueSoon(req.dueDate);
                  return (
                    <div
                      key={req.id}
                      className={`relative bg-white rounded-xl border p-5 flex flex-col gap-3 shadow-sm transition-all hover:shadow-md ${
                        overdue
                          ? "border-red-200 bg-red-50/30"
                          : soon
                          ? "border-amber-200 bg-amber-50/30"
                          : "border-neutral-200"
                      }`}
                    >
                      {overdue && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                          <AlertCircle className="h-3.5 w-3.5" /> Overdue
                        </div>
                      )}
                      {soon && !overdue && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                          <Clock className="h-3.5 w-3.5" /> Due Soon
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-neutral-900">{req.title}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Year: {req.year} · Due: {new Date(req.dueDate).toLocaleDateString()}
                        </p>
                        {req.description && (
                          <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">{req.description}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => openSubmitModal(req)}
                        size="sm"
                        className="mt-auto gap-1.5 w-full justify-center"
                      >
                        <Plus className="h-4 w-4" /> Submit Report
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Submitted Reports ─── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <h5 className="text-base font-semibold text-neutral-900">
                Submitted Reports {reports.length > 0 && `(${reports.length})`}
              </h5>
            </div>

            {reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-dashed border-neutral-200">
                <div className="bg-indigo-50 p-4 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-1">No Submissions Yet</h3>
                <p className="text-sm text-neutral-500 max-w-sm">
                  Submitted reports will appear here once you fulfill a pending request.
                </p>
              </div>
            ) : (
              <DataTable columns={submittedColumns} data={reports} rowKey={(row) => row.id} />
            )}
          </div>
        </>
      )}

      {/* Submit Report Modal */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); resetForm(); }}
        title={linkedRequest ? `Submit: ${linkedRequest.title}` : "Submit Annual Report"}
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {linkedRequest && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-semibold">Year: {linkedRequest.year}</p>
              {linkedRequest.description && <p className="mt-0.5 text-blue-700">{linkedRequest.description}</p>}
              <p className="mt-1 text-blue-600 text-xs">Due: {new Date(linkedRequest.dueDate).toLocaleDateString()}</p>
            </div>
          )}

          {/* Payment Method Selector */}
          {paymentMethods.length > 0 && (() => {
            const telebirr = paymentMethods.filter((m) => m.value === "payment_telebirr");
            const banks = paymentMethods.filter((m) => m.value !== "payment_telebirr");
            const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId);

            return (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-neutral-600">Select Payment Method</label>

                {/* Mobile Money */}
                {telebirr.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Smartphone className="h-3 w-3" /> Mobile Money
                    </p>
                    {telebirr.map((m) => {
                      const isSelected = selectedMethodId === m.id;
                      return (
                        <button key={m.id} type="button" onClick={() => setSelectedMethodId(isSelected ? null : m.id)}
                          className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${isSelected ? "border-green-500 bg-green-50 ring-1 ring-green-400" : "border-neutral-200 bg-white hover:border-green-300"}`}
                        >
                          <div className="p-1.5 rounded-lg bg-green-100"><Smartphone className="h-4 w-4 text-green-600" /></div>
                          <div className="flex-1"><p className="font-semibold text-sm text-neutral-900">{m.description}</p></div>
                          <div className={`w-4 h-4 rounded-full border-2 ${isSelected ? "border-green-500 bg-green-500" : "border-neutral-300"}`} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Banks */}
                {banks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Landmark className="h-3 w-3" /> Bank Transfer
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {banks.map((m) => {
                        const isSelected = selectedMethodId === m.id;
                        return (
                          <button key={m.id} type="button" onClick={() => setSelectedMethodId(isSelected ? null : m.id)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all ${isSelected ? "border-blue-500 bg-blue-50 ring-1 ring-blue-400" : "border-neutral-200 bg-white hover:border-blue-300"}`}
                          >
                            <div className="p-1 rounded-md bg-blue-100 flex-shrink-0"><Landmark className="h-3.5 w-3.5 text-blue-600" /></div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs text-neutral-900 leading-tight truncate">{m.note}</p>
                              <p className="text-[10px] text-neutral-400 mt-0.5">Bank Transfer</p>
                            </div>
                            <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${isSelected ? "border-blue-500 bg-blue-500" : "border-neutral-300"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected method details */}
                {selectedMethod?.config && (
                  <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-xs space-y-1">
                    <p className="font-semibold text-neutral-700 mb-1.5">{selectedMethod.description} — Payment Details</p>
                    {selectedMethod.config.bankName && <p className="text-neutral-600">Bank: <span className="font-medium">{selectedMethod.config.bankName}</span></p>}
                    {selectedMethod.config.accountName && <p className="text-neutral-600">Account Name: <span className="font-semibold">{selectedMethod.config.accountName}</span></p>}
                    {selectedMethod.config.accountNumber && <p className="text-neutral-600">Account No: <span className="font-mono font-bold text-neutral-900">{selectedMethod.config.accountNumber}</span></p>}
                    {selectedMethod.config.phoneNumber && <p className="text-neutral-600">Phone: <span className="font-mono font-bold text-neutral-900">{selectedMethod.config.phoneNumber}</span></p>}
                    {selectedMethod.config.instructions && <p className="text-blue-700 mt-1.5 border-t border-neutral-200 pt-1.5">{selectedMethod.config.instructions}</p>}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-4">
            <FormField id="bankReference" label="Bank Reference (Optional)">
              <Input
                placeholder="Enter Bank Reference..."
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                className={verificationStatus === "success" ? "border-green-400 focus:border-green-500" : verificationStatus === "error" ? "border-red-400 focus:border-red-500" : ""}
              />
              {/* Inline verification status */}
              {verificationStatus === "verifying" && (
                <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                  Verifying payment...
                </p>
              )}
              {verificationStatus === "success" && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">✓ {verificationMsg}</p>
              )}
              {verificationStatus === "error" && (
                <p className="text-xs text-red-500 mt-1">{verificationMsg}</p>
              )}
            </FormField>
            <FormField id="reportFile" label="Report File (PDF)">
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files?.[0]) setReportFile(e.target.files[0]);
                }}
              />
            </FormField>
          </div>

          <FormField id="remark" label="Remarks">
            <Input placeholder="Any additional notes..." value={remark} onChange={(e) => setRemark(e.target.value)} />
          </FormField>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

          {feePreviewLoading ? (
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs text-neutral-500 animate-pulse">
              Calculating your fee...
            </div>
          ) : feePreview ? (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm text-blue-900">Annual Reporting Fee</span>
                <span className="font-bold text-lg text-blue-700">
                  {feePreview.amount} {feePreview.currency}
                </span>
              </div>
              <p className="text-xs text-blue-800">
                If you have already paid this amount at the bank, please enter your Bank Reference above. Otherwise, you can submit the report now and download your invoice to pay later.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
              <p className="font-semibold mb-0.5">💡 About your reporting fee</p>
              <p>No fee rule matched. If you have already paid at the bank, please enter your Bank Reference above.</p>
            </div>
          )}

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating || verificationStatus === "verifying"} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {verificationStatus === "verifying" ? "Verifying..." : creating ? "Submitting..." : "Submit Report"}
            </Button>
          </ModalFooter>
        </form>
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
