"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, Filter, RefreshCw, ArrowRight, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

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

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function ApplicationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

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

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const counts = {
    PENDING: requests.filter(r => r.status === "PENDING").length,
    APPROVED: requests.filter(r => r.status === "APPROVED").length,
    REJECTED: requests.filter(r => r.status === "REJECTED").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Online Applications</h1>
          <p className="text-sm text-neutral-500 mt-1">Review and approve church registration requests submitted online.</p>
        </div>
        <button onClick={fetchRequests} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-3 flex-wrap">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === s
                ? STATUS_COLORS[s] + " border-transparent"
                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
            }`}>
            {s === "PENDING" && <Clock className="inline mr-1.5" size={12} />}
            {s === "APPROVED" && <CheckCircle className="inline mr-1.5" size={12} />}
            {s === "REJECTED" && <XCircle className="inline mr-1.5" size={12} />}
            {s} ({counts[s]})
          </button>
        ))}
        <button onClick={() => setStatusFilter("")}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            !statusFilter
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
              : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
          }`}>
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
              {requests.map(req => (
                <tr key={req.id}
                  onClick={() => router.push(`/applications/${req.id}`)}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer">
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
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[req.status]}`}>
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
  );
}
