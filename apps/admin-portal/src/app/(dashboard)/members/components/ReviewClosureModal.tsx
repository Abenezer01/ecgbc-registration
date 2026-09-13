"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Archive,
  Calendar,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  User,
  Phone,
  Mail
} from "lucide-react";
import { Modal, ModalFooter, Button, FormField, Input } from "@/components/ui";
import { ClosureRequestItem, useApproveClosureRequest, useRejectClosureRequest } from "@/hooks/useClosureRequests";
import { toast } from "react-hot-toast";

interface ReviewClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ClosureRequestItem | null;
  onSuccess?: () => void;
}

export function ReviewClosureModal({
  isOpen,
  onClose,
  request,
  onSuccess,
}: ReviewClosureModalProps) {
  const { mutateAsync: approveClosure, isPending: approving } = useApproveClosureRequest();
  const { mutateAsync: rejectClosure, isPending: rejecting } = useRejectClosureRequest();

  const [decision, setDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reviewRemarks, setReviewRemarks] = useState("");

  if (!request) return null;

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();

    if (decision === "REJECT" && !reviewRemarks.trim()) {
      toast.error("Please provide rejection remarks / rationale");
      return;
    }

    try {
      if (decision === "APPROVE") {
        await approveClosure({
          requestId: request.id,
          reviewRemarks: reviewRemarks.trim() || undefined,
        });
        toast.success(`Church "${request.member?.name}" voluntarily closed with complete record retention`);
      } else {
        await rejectClosure({
          requestId: request.id,
          reviewRemarks: reviewRemarks.trim(),
        });
        toast.success("Voluntary closure request rejected");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process closure review");
    }
  };

  const isSubmitting = approving || rejecting;
  const isPending = request.status === "PENDING";

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isPending ? "Review Voluntary Closure Request" : "Voluntary Closure Request Details"}
      size="lg"
    >
      <form onSubmit={handleProcess} className="space-y-5">
        {/* Banner */}
        {isPending ? (
          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                Pending Closure: {request.member?.name} ({request.member?.certificateNo})
              </p>
              <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
                Carefully review the submitted board resolution and archive custody arrangements. Approving this request transitions the church to an inactive, voluntarily closed state while permanently preserving all historical records.
              </p>
            </div>
          </div>
        ) : request.status === "APPROVED" ? (
          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                Closure Approved: {request.member?.name} ({request.member?.certificateNo})
              </p>
              <p className="leading-relaxed">
                This church was voluntarily closed on {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : "—"}{request.reviewer ? ` by ${request.reviewer.firstName} ${request.reviewer.lastName}` : ""}.
                {request.reviewRemarks && ` Remarks: "${request.reviewRemarks}"`}
              </p>
            </div>
          </div>
        ) : request.status === "REJECTED" ? (
          <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 flex items-start gap-3 text-xs text-red-800 dark:text-red-300">
            <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                Closure Rejected: {request.member?.name} ({request.member?.certificateNo})
              </p>
              <p className="leading-relaxed">
                Rejected on {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : "—"}{request.reviewer ? ` by ${request.reviewer.firstName} ${request.reviewer.lastName}` : ""}.
                {request.reviewRemarks && ` Reason: "${request.reviewRemarks}"`}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-start gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <AlertTriangle className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                Request Cancelled
              </p>
              <p className="leading-relaxed mt-0.5">
                This request was cancelled by the church leadership before admin review.
              </p>
            </div>
          </div>
        )}

        {/* Request Details Summary Card */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-zinc-500 font-medium">Closure Reason Type:</span>
              <p className="font-semibold text-zinc-900 dark:text-white mt-0.5">
                {request.closureType}
              </p>
            </div>
            <div>
              <span className="text-zinc-500 font-medium">Requested Effective Date:</span>
              <p className="font-semibold text-zinc-900 dark:text-white mt-0.5 flex items-center gap-1">
                <Calendar size={13} className="text-zinc-400" />
                {new Date(request.effectiveDate).toLocaleDateString()}
              </p>
            </div>
            {request.resolutionDate && (
              <div>
                <span className="text-zinc-500 font-medium">Board / Assembly Resolution Date:</span>
                <p className="text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {new Date(request.resolutionDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {request.recordsLocation && (
              <div>
                <span className="text-zinc-500 font-medium">Archive / Records Custody Location:</span>
                <p className="text-zinc-800 dark:text-zinc-200 mt-0.5 flex items-center gap-1">
                  <Archive size={13} className="text-zinc-400" />
                  {request.recordsLocation}
                </p>
              </div>
            )}
          </div>

          <div>
            <span className="text-zinc-500 font-medium">Detailed Rationale:</span>
            <p className="mt-1 p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {request.reason}
            </p>
          </div>

          {(request.contactPersonName || request.contactPersonPhone || request.contactPersonEmail) && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
              {request.contactPersonName && (
                <span className="flex items-center gap-1">
                  <User size={12} /> {request.contactPersonName}
                </span>
              )}
              {request.contactPersonPhone && (
                <span className="flex items-center gap-1">
                  <Phone size={12} /> {request.contactPersonPhone}
                </span>
              )}
              {request.contactPersonEmail && (
                <span className="flex items-center gap-1">
                  <Mail size={12} /> {request.contactPersonEmail}
                </span>
              )}
            </div>
          )}

          {request.resolutionDocumentUrl && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Resolution Minutes / Letter:</span>
              <a
                href={request.resolutionDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
              >
                View Attached Document <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Administrative Decision (Only if Pending) */}
        {isPending ? (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                Administrative Decision *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision("APPROVE")}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-colors ${
                    decision === "APPROVE"
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20"
                      : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${decision === "APPROVE" ? "text-emerald-600" : "text-zinc-400"}`} />
                  <div>
                    <p className="font-semibold text-xs">Approve Voluntary Closure</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Deactivates active church, disables portal logins, preserves full archives.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision("REJECT")}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-colors ${
                    decision === "REJECT"
                      ? "border-red-500 bg-red-50/60 dark:bg-red-950/20 text-red-900 dark:text-red-200 ring-2 ring-red-500/20"
                      : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <XCircle className={`h-4 w-4 shrink-0 mt-0.5 ${decision === "REJECT" ? "text-red-600" : "text-zinc-400"}`} />
                  <div>
                    <p className="font-semibold text-xs">Reject Closure Request</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Church remains active. State reason for rejection below.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <FormField
              id="reviewRemarks"
              label={decision === "APPROVE" ? "Resolution Reference / Approval Remarks" : "Rejection Reason & Remarks *"}
              required={decision === "REJECT"}
            >
              <Input
                type="text"
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder={
                  decision === "APPROVE"
                    ? "e.g. Approved per Executive Board Resolution #48/2026"
                    : "State reason why this closure request was rejected..."
                }
              />
            </FormField>
          </div>
        ) : null}

        <ModalFooter className="mt-4 flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          {isPending ? (
            <>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (decision === "REJECT" && !reviewRemarks.trim())}
                className={decision === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : decision === "APPROVE" ? (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Confirm Closure Approval
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Request
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={onClose}>
              Close
            </Button>
          )}
        </ModalFooter>
      </form>
    </Modal>
  );
}
