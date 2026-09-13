"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  ArrowRight,
  Loader2,
  Building2,
  AlertTriangle,
  Archive,
  Calendar,
  Eye,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { useClosureRequests, ClosureRequestItem } from "@/hooks/useClosureRequests";
import { ReviewClosureModal } from "../members/components/ReviewClosureModal";

interface RegistrationRequest {
  id: string;
  nameAm: string;
  nameEn?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  phoneNumber?: string;
  contactPersonName: string;
  contactPersonPhone: string;
  createdAt: string;
  type?: { id: string; description: string };
  region?: { id: string; description: string };
  files?: Array<{ id: string }>;
}

const REG_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const CLOSURE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  CANCELLED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
};

const CLOSURE_TYPE_LABELS: Record<string, string> = {
  DISSOLUTION: "Assembly Dissolution",
  LOW_MEMBERSHIP: "Low Membership",
  FINANCIAL_HARDSHIP: "Financial Hardship",
  LEADERSHIP_VACANCY: "Leadership Vacancy",
  EXTERNAL_AMALGAMATION: "External Amalgamation",
  OTHER: "Other Voluntary Reason",
};

export default function ApplicationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"REGISTRATIONS" | "CLOSURES">("REGISTRATIONS");

  // Registration state
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

  // Closure state
  const [closureStatusFilter, setClosureStatusFilter] = useState<string>("PENDING");
  const [selectedClosureRequest, setSelectedClosureRequest] = useState<ClosureRequestItem | null>(null);
  const [isReviewClosureOpen, setIsReviewClosureOpen] = useState(false);

  const {
    data: closuresData,
    isLoading: closuresLoading,
    refetch: refetchClosures,
  } = useClosureRequests({
    status: closureStatusFilter === "ALL" ? undefined : closureStatusFilter,
  });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const res = await api.get(`/registration-requests${params}`);
      const list = res.data?.data ?? [];
      setRequests(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const regCounts = {
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    APPROVED: requests.filter((r) => r.status === "APPROVED").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
  };

  const handleRefresh = () => {
    if (activeTab === "REGISTRATIONS") {
      fetchRequests();
    } else {
      refetchClosures();
    }
  };

  const handleOpenClosureModal = (req: ClosureRequestItem) => {
    setSelectedClosureRequest(req);
    setIsReviewClosureOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Governance & Applications</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage church onboarding applications and church-initiated voluntary closure / deactivation requests.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 text-sm font-medium border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Main Tab Switcher */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 flex gap-6">
        <button
          onClick={() => setActiveTab("REGISTRATIONS")}
          className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
            activeTab === "REGISTRATIONS"
              ? "text-primary border-b-2 border-primary font-semibold"
              : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          }`}
        >
          <Building2 size={16} />
          New Church Applications
          {regCounts.PENDING > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-semibold">
              {regCounts.PENDING}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("CLOSURES")}
          className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
            activeTab === "CLOSURES"
              ? "text-primary border-b-2 border-primary font-semibold"
              : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          }`}
        >
          <Archive size={16} />
          Voluntary Closure Requests
          {closuresData?.requests && closuresData.requests.filter((r) => r.status === "PENDING").length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 font-semibold">
              {closuresData.requests.filter((r) => r.status === "PENDING").length}
            </span>
          )}
        </button>
      </div>

      {/* ======================= NEW REGISTRATIONS TAB ======================= */}
      {activeTab === "REGISTRATIONS" && (
        <div className="space-y-4">
          {/* Filter chips */}
          <div className="flex gap-3 flex-wrap">
            {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  statusFilter === s
                    ? REG_STATUS_COLORS[s] + " border-transparent"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {s === "PENDING" && <Clock className="inline mr-1.5" size={12} />}
                {s === "APPROVED" && <CheckCircle className="inline mr-1.5" size={12} />}
                {s === "REJECTED" && <XCircle className="inline mr-1.5" size={12} />}
                {s} ({regCounts[s]})
              </button>
            ))}
            <button
              onClick={() => setStatusFilter("")}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                !statusFilter
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
                  : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
              }`}
            >
              <Filter className="inline mr-1.5" size={12} />
              All ({requests.length})
            </button>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-neutral-400 gap-2">
                <Loader2 className="animate-spin" size={18} /> Loading applications...
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-neutral-400 gap-2">
                <CheckCircle size={36} className="opacity-30" />
                <p>No {statusFilter.toLowerCase()} applications</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Church Name</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Region</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Contact Person</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Docs</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Submitted</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => router.push(`/applications/${req.id}`)}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900 dark:text-white">{req.nameAm}</div>
                        {req.nameEn && <div className="text-xs text-neutral-400">{req.nameEn}</div>}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{req.type?.description ?? "—"}</td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{req.region?.description ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="text-neutral-700 dark:text-neutral-300">{req.contactPersonName}</div>
                        <div className="text-xs text-neutral-400">{req.contactPersonPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                          {req.files?.length ?? 0} file{(req.files?.length ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${REG_STATUS_COLORS[req.status]}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          Review <ArrowRight size={12} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ======================= VOLUNTARY CLOSURE TAB ======================= */}
      {activeTab === "CLOSURES" && (
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Voluntary Church Self-Deactivation Lifecycle</p>
              <p className="text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                Churches initiate self-deactivation when dissolving, facing leadership vacancies, or merging into another body.
                Approving deactivates active church operations and portal credentials while retaining the complete historical record (lineage, finances, certificates, filings).
              </p>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-3 flex-wrap">
            {[
              { id: "PENDING", label: "Pending Review", icon: Clock },
              { id: "APPROVED", label: "Approved / Closed", icon: CheckCircle },
              { id: "REJECTED", label: "Rejected", icon: XCircle },
              { id: "ALL", label: "All Requests", icon: Filter },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setClosureStatusFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors flex items-center gap-1.5 ${
                  closureStatusFilter === tab.id
                    ? tab.id === "PENDING"
                      ? "bg-amber-500 text-white border-transparent"
                      : tab.id === "APPROVED"
                      ? "bg-emerald-600 text-white border-transparent"
                      : tab.id === "REJECTED"
                      ? "bg-red-600 text-white border-transparent"
                      : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Closure Requests Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {closuresLoading ? (
              <div className="flex items-center justify-center h-48 text-neutral-400 gap-2">
                <Loader2 className="animate-spin" size={18} /> Loading closure requests...
              </div>
            ) : !closuresData?.requests || closuresData.requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-neutral-400 gap-2">
                <Archive size={36} className="opacity-30" />
                <p>No voluntary closure requests found</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Church</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Reason Category</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Effective Date</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Origin / Initiator</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Submitted</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-500 dark:text-neutral-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {closuresData.requests.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => handleOpenClosureModal(req)}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-neutral-900 dark:text-white">
                          {req.member?.name || "Unknown Member"}
                        </div>
                        <div className="text-xs text-neutral-400 font-mono">
                          {req.member?.certificateNo || "No Cert"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">
                          {CLOSURE_TYPE_LABELS[req.closureType] || req.closureType}
                        </span>
                        <p className="text-xs text-neutral-500 truncate max-w-xs">{req.reason}</p>
                      </td>

                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} className="text-neutral-400" />
                          {new Date(req.effectiveDate).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-xs">
                        <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-medium">
                          {req.submittedByType === "CHURCH_USER" ? "Church Leadership" : "HQ Staff"}
                        </span>
                        {req.contactPersonName && (
                          <div className="text-neutral-500 text-[11px] mt-0.5">{req.contactPersonName}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-neutral-500 text-xs whitespace-nowrap">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            CLOSURE_STATUS_COLORS[req.status] || CLOSURE_STATUS_COLORS.CANCELLED
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenClosureModal(req);
                          }}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                            req.status === "PENDING"
                              ? "bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                              : "border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                          }`}
                        >
                          {req.status === "PENDING" ? (
                            <>
                              Review <ArrowRight size={12} />
                            </>
                          ) : (
                            <>
                              <Eye size={12} /> Details
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Review & Details Modal */}
      {selectedClosureRequest && (
        <ReviewClosureModal
          isOpen={isReviewClosureOpen}
          onClose={() => {
            setIsReviewClosureOpen(false);
            setSelectedClosureRequest(null);
          }}
          request={selectedClosureRequest}
          onSuccess={() => {
            refetchClosures();
          }}
        />
      )}
    </div>
  );
}

