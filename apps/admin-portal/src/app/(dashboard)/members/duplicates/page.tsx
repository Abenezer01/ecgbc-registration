"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Phone,
  Users,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Search,
} from "lucide-react";
import { PageHeader, Button, Badge, Spinner } from "@/components/ui";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

interface DuplicateMemberSummary {
  id: string;
  name: string;
  nameEn?: string | null;
  certificateNo: string;
  phoneNumber?: string | null;
  city?: string | null;
  subcity?: string | null;
  district?: string | null;
  houseNumber?: string | null;
  isActive: boolean;
  roleOrNote?: string;
}

interface DuplicateCluster {
  id: string;
  type: "PHONE" | "BOARD_MEMBER" | "LOCATION";
  matchField: string;
  matchValue: string;
  members: DuplicateMemberSummary[];
}

export default function DuplicateAuditPage() {
  const router = useRouter();
  const [clusters, setClusters] = useState<DuplicateCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "PHONE" | "BOARD_MEMBER" | "LOCATION">("ALL");
  const [search, setSearch] = useState("");

  const fetchAudit = async (showToast = false) => {
    try {
      const res = await api.get("/members/duplicates/audit");
      setClusters(res.data?.data || []);
      if (showToast) {
        toast.success("Duplicate audit completed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to run duplicate audit");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAudit(true);
  };

  const counts = useMemo(() => {
    const phoneCount = clusters.filter((c) => c.type === "PHONE").length;
    const bmCount = clusters.filter((c) => c.type === "BOARD_MEMBER").length;
    const locCount = clusters.filter((c) => c.type === "LOCATION").length;
    return { all: clusters.length, phone: phoneCount, bm: bmCount, location: locCount };
  }, [clusters]);

  const filteredClusters = useMemo(() => {
    return clusters.filter((cluster) => {
      if (activeTab !== "ALL" && cluster.type !== activeTab) {
        return false;
      }
      if (!search.trim()) return true;

      const q = search.toLowerCase();
      const matchesValue = cluster.matchValue.toLowerCase().includes(q);
      const matchesMember = cluster.members.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.nameEn && m.nameEn.toLowerCase().includes(q)) ||
          m.certificateNo.toLowerCase().includes(q)
      );
      return matchesValue || matchesMember;
    });
  }, [clusters, activeTab, search]);

  const getClusterIcon = (type: DuplicateCluster["type"]) => {
    switch (type) {
      case "PHONE":
        return <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "BOARD_MEMBER":
        return <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case "LOCATION":
        return <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const getClusterBadge = (type: DuplicateCluster["type"]) => {
    switch (type) {
      case "PHONE":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Phone Conflict
          </span>
        );
      case "BOARD_MEMBER":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Board Member Overlap
          </span>
        );
      case "LOCATION":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Address Conflict
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Existing Churches Duplicate Audit"
        description="Cross-field scan of all registered churches by phone numbers, leadership overlap, and exact physical locations."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/members")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Members
            </Button>
            <Button onClick={handleRefresh} disabled={refreshing || loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Scanning..." : "Re-run Audit"}
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab("ALL")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === "ALL"
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-600 shadow-sm"
              : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
          }`}
        >
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Clusters</span>
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            {loading ? <Spinner size="sm" /> : counts.all}
          </div>
          <p className="text-xs text-neutral-400 mt-1">Total conflict groups found</p>
        </div>

        <div
          onClick={() => setActiveTab("PHONE")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === "PHONE"
              ? "bg-blue-50 dark:bg-blue-950/20 border-blue-400 dark:border-blue-600 shadow-sm"
              : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
          }`}
        >
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Phone Conflicts</span>
            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            {loading ? <Spinner size="sm" /> : counts.phone}
          </div>
          <p className="text-xs text-neutral-400 mt-1">Shared church or contact phone</p>
        </div>

        <div
          onClick={() => setActiveTab("BOARD_MEMBER")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === "BOARD_MEMBER"
              ? "bg-purple-50 dark:bg-purple-950/20 border-purple-400 dark:border-purple-600 shadow-sm"
              : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
          }`}
        >
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Board Overlaps</span>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            {loading ? <Spinner size="sm" /> : counts.bm}
          </div>
          <p className="text-xs text-neutral-400 mt-1">Members on multiple boards</p>
        </div>

        <div
          onClick={() => setActiveTab("LOCATION")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === "LOCATION"
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600 shadow-sm"
              : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
          }`}
        >
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Address Clashes</span>
            <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            {loading ? <Spinner size="sm" /> : counts.location}
          </div>
          <p className="text-xs text-neutral-400 mt-1">Exact house / location matches</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(["ALL", "PHONE", "BOARD_MEMBER", "LOCATION"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {tab === "ALL" && "All Conflicts"}
              {tab === "PHONE" && "Phone"}
              {tab === "BOARD_MEMBER" && "Board Members"}
              {tab === "LOCATION" && "Address"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search church or value..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-400">
          <Spinner size="lg" className="mb-3 text-amber-600" />
          <p className="text-sm font-medium">Scanning all registered churches for duplicate fields...</p>
        </div>
      ) : filteredClusters.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <ShieldCheck size={28} />
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            No Duplicate Conflicts Found
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mt-1">
            {search
              ? "No duplicate clusters match your search query."
              : "All registered churches in this category have unique contact numbers, board personnel, and physical addresses."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClusters.map((cluster) => (
            <div
              key={cluster.id}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm"
            >
              {/* Cluster Header */}
              <div className="px-5 py-3.5 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {getClusterIcon(cluster.type)}
                  <span className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                    {cluster.matchField}:
                  </span>
                  <span className="text-sm font-bold text-neutral-900 dark:text-white font-mono">
                    {cluster.matchValue}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {getClusterBadge(cluster.type)}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                    {cluster.members.length} Churches
                  </span>
                </div>
              </div>

              {/* Members in Conflict */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cluster.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1">
                            {member.name}
                          </h4>
                          {member.nameEn && (
                            <p className="text-xs text-neutral-400 line-clamp-1">{member.nameEn}</p>
                          )}
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            member.isActive
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                          }`}
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                        <p>
                          <span className="text-neutral-400">Cert:</span>{" "}
                          <span className="font-mono font-medium">{member.certificateNo}</span>
                        </p>
                        {member.phoneNumber && (
                          <p>
                            <span className="text-neutral-400">Phone:</span> {member.phoneNumber}
                          </p>
                        )}
                        {(member.city || member.subcity) && (
                          <p>
                            <span className="text-neutral-400">Location:</span>{" "}
                            {[member.city, member.subcity].filter(Boolean).join(", ")}
                          </p>
                        )}
                        {member.roleOrNote && (
                          <div className="mt-1 pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                            {member.roleOrNote}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end">
                      <a
                        href={`/members/${member.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                      >
                        Inspect Church <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
