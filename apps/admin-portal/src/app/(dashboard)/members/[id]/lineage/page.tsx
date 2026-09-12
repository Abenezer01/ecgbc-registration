"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  GitMerge,
  GitFork,
  ArrowRight,
  ExternalLink,
  Clock,
  User,
  FileText,
  FolderOpen,
  Users,
  ShieldAlert,
  History,
  Calendar,
  Layers,
  AlertCircle,
  Building2
} from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { useMember } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { MergeChurchModal } from "../../components/MergeChurchModal";
import { SplitChurchModal } from "../../components/SplitChurchModal";

interface LineageItem {
  lineageId: string;
  type: "MERGE" | "SPLIT";
  effectiveDate: string;
  reason: string;
  notes?: string;
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  church: {
    id: string;
    name: string;
    nameEn?: string;
    certificateNo: string;
    city?: string;
    subcity?: string;
    isActive: boolean;
    currentActionState?: string;
    phoneNumber?: string;
  };
}

interface LineageData {
  currentMember: {
    id: string;
    name: string;
    nameEn?: string;
    certificateNo: string;
    isActive: boolean;
    currentActionState?: string;
  };
  parents: LineageItem[];
  children: LineageItem[];
}

export default function MemberLineagePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: member, isLoading: memberLoading } = useMember(id);
  const { hasPermission } = useAuth();

  const [lineage, setLineage] = useState<LineageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [splitModalOpen, setSplitModalOpen] = useState(false);

  const canEdit = hasPermission("change_member");
  const canViewFiles = hasPermission("view_file") || hasPermission("view_member");
  const canViewReports = hasPermission("view_report") || hasPermission("view_member");
  const canManageUsers = hasPermission("view_church_user") || hasPermission("view_member");
  const canDeactivate = hasPermission("deactivate_member") || hasPermission("delete_member");

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
  const currentPath = `/members/${id}/lineage`;

  const fetchLineage = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/members/${id}/lineage`);
      setLineage(res.data?.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load church lineage");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineage();
  }, [id]);

  if (memberLoading) {
    return <div className="p-10 text-center animate-pulse">Loading church lineage...</div>;
  }

  if (!member) {
    return <div className="p-10 text-center text-zinc-500">Member not found.</div>;
  }

  const m = member as any;

  return (
    <>
      {/* Navigation Tabs */}
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
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Header & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                Church Lineage & History Hierarchy
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Preserves full organizational heritage through parent-child lineage. Predecessor records and archives remain permanently accessible.
              </p>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => setMergeModalOpen(true)}
                  className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                >
                  <GitMerge className="mr-1.5 h-4 w-4 text-amber-600" />
                  Merge Into This Church
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSplitModalOpen(true)}
                  className="text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                >
                  <GitFork className="mr-1.5 h-4 w-4 text-purple-600" />
                  Split / Branch Daughters
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
              <Spinner size="lg" className="mb-3 text-blue-600" />
              <p className="text-xs">Loading lineage hierarchy...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* SECTION 1: Predecessors / Parents (Merged into this church or mother church) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <GitMerge className="h-4 w-4 text-amber-600" />
                    Predecessor / Mother Churches (Ancestors)
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {lineage?.parents.length || 0} recorded
                  </span>
                </div>

                {(!lineage?.parents || lineage.parents.length === 0) ? (
                  <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
                    No predecessor or mother churches recorded for this member.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {lineage.parents.map((p) => (
                      <div
                        key={p.lineageId}
                        className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/10 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                                {p.church.name}
                              </h4>
                              {p.church.nameEn && (
                                <p className="text-xs text-zinc-400">{p.church.nameEn}</p>
                              )}
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              {p.type === "MERGE" ? "Merged Church" : "Mother Church"}
                            </span>
                          </div>

                          <div className="text-xs space-y-1 text-zinc-600 dark:text-zinc-400">
                            <p>
                              <span className="text-zinc-400">Cert No:</span>{" "}
                              <span className="font-mono font-medium">{p.church.certificateNo}</span>
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-zinc-500">
                              <Calendar size={12} /> Effective: {new Date(p.effectiveDate).toLocaleDateString()}
                            </p>
                            {p.reason && (
                              <div className="mt-1.5 p-2 rounded bg-white dark:bg-zinc-900 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-zinc-700 dark:text-zinc-300">
                                <span className="font-semibold text-amber-800 dark:text-amber-400">Resolution:</span>{" "}
                                {p.reason}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-amber-200/50 dark:border-amber-900/40 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400">
                            Status: <span className="font-medium text-amber-600">{p.church.currentActionState || "INACTIVE"}</span>
                          </span>
                          <a
                            href={`/members/${p.church.id}/reports`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                          >
                            Inspect Historical Archive <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Church Anchor */}
              <div className="p-4 rounded-xl border-2 border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                      Current Church Record
                    </span>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                      {m.name}
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono">
                      Certificate #{m.certificateNo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    m.isActive
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                  }`}>
                    {m.isActive ? "Active Member" : (m.currentActionState || "Inactive")}
                  </span>
                </div>
              </div>

              {/* SECTION 2: Successor & Daughter Branches (Split or Merged out) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <GitFork className="h-4 w-4 text-purple-600" />
                    Successor & Daughter Branches (Descendants)
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {lineage?.children.length || 0} recorded
                  </span>
                </div>

                {(!lineage?.children || lineage.children.length === 0) ? (
                  <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
                    No daughter branches or successor mergers established from this church.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {lineage.children.map((c) => (
                      <div
                        key={c.lineageId}
                        className="p-4 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-950/10 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                                {c.church.name}
                              </h4>
                              {c.church.nameEn && (
                                <p className="text-xs text-zinc-400">{c.church.nameEn}</p>
                              )}
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                              {c.type === "SPLIT" ? "Daughter Branch" : "Successor Church"}
                            </span>
                          </div>

                          <div className="text-xs space-y-1 text-zinc-600 dark:text-zinc-400">
                            <p>
                              <span className="text-zinc-400">Cert No:</span>{" "}
                              <span className="font-mono font-medium">{c.church.certificateNo}</span>
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-zinc-500">
                              <Calendar size={12} /> Established: {new Date(c.effectiveDate).toLocaleDateString()}
                            </p>
                            {c.reason && (
                              <div className="mt-1.5 p-2 rounded bg-white dark:bg-zinc-900 border border-purple-200/60 dark:border-purple-900/40 text-[11px] text-zinc-700 dark:text-zinc-300">
                                <span className="font-semibold text-purple-800 dark:text-purple-400">Resolution:</span>{" "}
                                {c.reason}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-purple-200/50 dark:border-purple-900/40 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400">
                            Status: <span className="font-medium text-purple-600">{c.church.isActive ? "ACTIVE" : c.church.currentActionState}</span>
                          </span>
                          <a
                            href={`/members/${c.church.id}/overview`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-400 hover:underline"
                          >
                            Inspect Church <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <MergeChurchModal
        isOpen={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        targetMember={{ id: m.id, name: m.name, certificateNo: m.certificateNo }}
        onSuccess={() => fetchLineage()}
      />

      <SplitChurchModal
        isOpen={splitModalOpen}
        onClose={() => setSplitModalOpen(false)}
        parentMember={{ id: m.id, name: m.name, certificateNo: m.certificateNo }}
        onSuccess={() => fetchLineage()}
      />
    </>
  );
}
