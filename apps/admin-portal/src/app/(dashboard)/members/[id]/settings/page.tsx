"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  User,
  FileText,
  FolderOpen,
  Users,
  ShieldAlert,
  History,
  GitFork,
  Archive,
  Calendar,
  Phone,
  Mail,
  ExternalLink,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Shield
} from "lucide-react";
import { Button, Modal, ModalFooter, FormField, Input, Badge } from "@/components/ui";
import { useMember } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";
import { useMemberClosureRequests, ClosureRequestItem } from "@/hooks/useClosureRequests";
import { VoluntaryClosureModal } from "../../components/VoluntaryClosureModal";
import { ReviewClosureModal } from "../../components/ReviewClosureModal";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: member, isLoading: memberLoading } = useMember(id);
  const { hasPermission } = useAuth();
  const { data: closureRequests = [], refetch: refetchClosures } = useMemberClosureRequests(id);

  const canViewFiles = hasPermission("view_file") || hasPermission("view_member");
  const canViewReports = hasPermission("view_report") || hasPermission("view_member");
  const canManageUsers = hasPermission("view_church_user") || hasPermission("view_member");
  const canDeactivate = hasPermission("deactivate_member") || hasPermission("delete_member");
  const canEdit = hasPermission("change_member");

  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ClosureRequestItem | null>(null);

  // Manual deactivation modal state
  const [manualDeactivateOpen, setManualDeactivateOpen] = useState(false);
  const [manualReason, setManualReason] = useState("");
  const [deactivating, setDeactivating] = useState(false);

  // Restoring state
  const [restoring, setRestoring] = useState(false);

  const pendingRequest = closureRequests.find((r) => r.status === "PENDING");
  const approvedClosure = closureRequests.find((r) => r.status === "APPROVED");

  const tabs = [
    { id: "overview", label: "Overview", icon: <User />, path: `/members/${id}/overview` },
    { id: "reports", label: "Reports", icon: <FileText />, path: `/members/${id}/reports`, visible: canViewReports },
    { id: "documents", label: "Documents", icon: <FolderOpen />, path: `/members/${id}/documents`, visible: canViewFiles },
    { id: "church-users", label: "Church Users", icon: <Users />, path: `/members/${id}/church-users`, visible: canManageUsers },
    { id: "history", label: "History", icon: <History />, path: `/members/${id}/history` },
    { id: "lineage", label: "Lineage", icon: <GitFork />, path: `/members/${id}/lineage` },
    { id: "settings", label: "Settings", icon: <ShieldAlert />, path: `/members/${id}/settings`, visible: canDeactivate },
  ];

  const visibleTabs = tabs.filter((t) => t.visible !== false);
  const currentPath = `/members/${id}/settings`;

  const handleManualDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReason.trim()) {
      toast.error("Please provide a reason for deactivation");
      return;
    }

    setDeactivating(true);
    try {
      await api.patch(`/members/${id}/inactive`, { reason: manualReason.trim() });
      toast.success("Member successfully deactivated");
      queryClient.invalidateQueries({ queryKey: ["member", id] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setManualDeactivateOpen(false);
      setManualReason("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to deactivate member");
    } finally {
      setDeactivating(false);
    }
  };

  const handleRestoreMember = async () => {
    const churchName = member?.name || member?.nameAm || `${member?.firstName || ""} ${member?.lastName || ""}`.trim() || "this church";
    if (!confirm(`Are you sure you want to restore and reinstate "${churchName}" to active status?`)) {
      return;
    }

    setRestoring(true);
    try {
      await api.patch(`/members/${id}/restore`, {});
      toast.success("Church successfully restored to active status");
      queryClient.invalidateQueries({ queryKey: ["member", id] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      refetchClosures();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to restore church");
    } finally {
      setRestoring(false);
    }
  };

  if (memberLoading) {
    return <div className="p-10 text-center animate-pulse">Loading settings...</div>;
  }

  if (!member) {
    return <div className="p-10 text-center text-zinc-500">Member not found.</div>;
  }

  const m = member as any;
  const isClosed = !m.isActive || m.currentActionState === "VOLUNTARILY_CLOSED";

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
                  ${
                    currentPath === tab.path
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }
                `}
              >
                {tab.icon && React.cloneElement(tab.icon as React.ReactElement<any>, { className: "h-4 w-4" })}
                {tab.label}
                {currentPath === tab.path && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 max-w-4xl">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              Church Lifecycle & Operational Governance
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Manage voluntary closure requests, administrative status deactivations, and church restoration with complete archival record retention.
            </p>
          </div>

          {/* SECTION 1: PENDING CLOSURE REQUEST BANNER */}
          {pendingRequest && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-6 relative overflow-hidden space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
                      Voluntary Closure Request Pending Administrative Review
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Submitted on {new Date(pendingRequest.createdAt).toLocaleDateString()} by{" "}
                      <strong>{pendingRequest.submittedByType === "CHURCH_USER" ? "Church Leadership" : "Staff"}</strong>.
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-200 text-amber-900 border-amber-400 dark:bg-amber-900/60 dark:text-amber-200 shrink-0">
                  PENDING REVIEW
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-amber-200 dark:border-amber-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500">Closure Reason Type:</span>
                  <p className="font-semibold text-zinc-900 dark:text-white mt-0.5">
                    {pendingRequest.closureType}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500">Requested Effective Date:</span>
                  <p className="font-semibold text-zinc-900 dark:text-white mt-0.5">
                    {new Date(pendingRequest.effectiveDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-zinc-500">Statement / Rationale:</span>
                  <p className="text-zinc-800 dark:text-zinc-200 mt-0.5 italic">
                    "{pendingRequest.reason}"
                  </p>
                </div>
                {pendingRequest.recordsLocation && (
                  <div className="sm:col-span-2">
                    <span className="text-zinc-500">Archive & Property Custody:</span>
                    <p className="text-zinc-800 dark:text-zinc-200 mt-0.5">
                      {pendingRequest.recordsLocation}
                    </p>
                  </div>
                )}
              </div>

              {canDeactivate && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    onClick={() => {
                      setSelectedRequest(pendingRequest);
                      setReviewModalOpen(true);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                  >
                    Review & Process Closure Request
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: CLOSED / ARCHIVED STATE */}
          {isClosed ? (
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Archive className="h-6 w-6 text-zinc-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      Voluntarily Closed Church Archive
                      <Badge className="bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                        {m.currentActionState || "INACTIVE"}
                      </Badge>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      This church's active operations are closed. All historical certificates, reports, files, and CRVs are permanently preserved in the archives with zero data loss.
                    </p>
                  </div>
                </div>

                {canDeactivate && (
                  <Button
                    variant="outline"
                    onClick={handleRestoreMember}
                    disabled={restoring}
                    className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 shrink-0"
                  >
                    {restoring ? (
                      <Loader2 className="animate-spin mr-1.5 h-4 w-4" />
                    ) : (
                      <RotateCcw className="mr-1.5 h-4 w-4" />
                    )}
                    Reinstate / Restore Church
                  </Button>
                )}
              </div>

              {m.reasonForInactive && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Closure Record:</span>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-1">{m.reasonForInactive}</p>
                </div>
              )}

              {approvedClosure && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-400">Resolution Date:</span>{" "}
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                      {approvedClosure.resolutionDate ? new Date(approvedClosure.resolutionDate).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Effective Date:</span>{" "}
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                      {new Date(approvedClosure.effectiveDate).toLocaleDateString()}
                    </span>
                  </div>
                  {approvedClosure.recordsLocation && (
                    <div className="sm:col-span-2">
                      <span className="text-zinc-400">Archival Custody Location:</span>{" "}
                      <span className="text-zinc-800 dark:text-zinc-200 font-medium">{approvedClosure.recordsLocation}</span>
                    </div>
                  )}
                  {approvedClosure.reviewer && (
                    <div className="sm:col-span-2 text-[11px] text-zinc-500 pt-1 border-t border-zinc-100 dark:border-zinc-700">
                      Approved by: {approvedClosure.reviewer.firstName} {approvedClosure.reviewer.lastName}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* SECTION 3: ACTIVE MEMBER LIFECYCLE OPTIONS */
            <div className="space-y-4">
              {/* Option A: Voluntary Closure Request */}
              {!pendingRequest && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                      <Archive className="h-5 w-5 text-amber-600" />
                      Initiate Voluntary Closure Workflow
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      If the congregation has resolved to cease operations, submit a formal closure request with meeting minutes and archival custody details. Preserves complete organizational records.
                    </p>
                  </div>
                  {canEdit && (
                    <Button
                      onClick={() => setClosureModalOpen(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 font-medium"
                    >
                      Initiate Voluntary Closure
                    </Button>
                  )}
                </div>
              )}

              {/* Option B: Emergency Administrative Deactivation */}
              {canDeactivate && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 relative overflow-hidden space-y-3">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                  <div>
                    <h3 className="text-base font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Administrative Emergency Deactivation
                    </h3>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 max-w-xl leading-relaxed">
                      For immediate suspension or non-voluntary administrative deactivation due to regulatory or disciplinary actions. Requires an administrative justification note.
                    </p>
                  </div>
                  <div className="pt-1">
                    <Button
                      variant="danger"
                      onClick={() => setManualDeactivateOpen(true)}
                      className="font-semibold shadow-sm text-xs"
                    >
                      Administrative Deactivation
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <VoluntaryClosureModal
        isOpen={closureModalOpen}
        onClose={() => setClosureModalOpen(false)}
        member={{
          id: m.id,
          name: m.name,
          certificateNo: m.certificateNo,
        }}
        onSuccess={() => {
          refetchClosures();
          queryClient.invalidateQueries({ queryKey: ["member", id] });
        }}
      />

      <ReviewClosureModal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onSuccess={() => {
          refetchClosures();
          queryClient.invalidateQueries({ queryKey: ["member", id] });
          queryClient.invalidateQueries({ queryKey: ["members"] });
        }}
      />

      {/* Manual Deactivation Modal */}
      <Modal
        open={manualDeactivateOpen}
        onClose={() => setManualDeactivateOpen(false)}
        title="Administrative Deactivation"
        size="md"
      >
        <form onSubmit={handleManualDeactivate} className="space-y-4">
          <div className="p-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 text-xs text-red-800 dark:text-red-300">
            <p className="font-semibold">Deactivating: {m.name} ({m.certificateNo})</p>
            <p className="mt-1">
              This action immediately sets the member status to inactive. All historical data remains archived.
            </p>
          </div>

          <FormField id="manualReason" label="Administrative Justification / Reason *" required>
            <textarea
              rows={3}
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              placeholder="State reason for administrative deactivation..."
              className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </FormField>

          <ModalFooter className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setManualDeactivateOpen(false)} disabled={deactivating}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={deactivating || !manualReason.trim()}>
              {deactivating ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Deactivating...
                </>
              ) : (
                "Confirm Deactivation"
              )}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
