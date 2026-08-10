"use client";

import React, { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Phone, Users, User, FileText, FolderOpen, ShieldAlert,
  AlertTriangle, Plus,
} from "lucide-react";
import {
  Card, CardContent, Button, Input, Select, FormField,
  Drawer, RowActions, presets, PhoneInput,
} from "@/components/ui";
import { useMember, useUpdateMember } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentCompleteness } from "@/hooks/useDocumentCompleteness";
import { useDataLookups } from "@/hooks/useDataLookups";
import { useApi } from "@/lib/useApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BoardMemberRow {
  id: string;
  fullName: string;
  fullNameEn: string;
  phoneNumber: string;
  titleId: string;
  isActive?: boolean;
  title?: { id: string; description: string; note?: string };
}

interface EditingState {
  /** existing board member id, or null when adding new */
  id: string | null;
  fullName: string;
  fullNameEn: string;
  phoneNumber: string;
  titleId: string;
  isActive: boolean;
}

const EMPTY: EditingState = { id: null, fullName: "", fullNameEn: "", phoneNumber: "", titleId: "", isActive: true };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { id } = useParams() as { id: string };
  const router  = useRouter();

  const { data: member, isLoading }       = useMember(id);
  const { data: documentCompleteness }    = useDocumentCompleteness(id);
  const { hasPermission }                 = useAuth();
  const { data: lookups = [] }            = useDataLookups();
  const { mutateAsync: updateMember, isPending: saving } = useUpdateMember();
  const { patch } = useApi();

  // ── drawer state ───────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft]           = useState<EditingState>(EMPTY);
  const [formError, setFormError]   = useState<string | null>(null);

  // ── permissions ────────────────────────────────────────────────────────────
  const canViewFiles   = hasPermission("view_file")        || hasPermission("view_member");
  const canViewReports = hasPermission("view_report")      || hasPermission("view_member");
  const canManageUsers = hasPermission("view_church_user") || hasPermission("view_member");
  const canDeactivate  = hasPermission("deactivate_member")|| hasPermission("delete_member");
  const canEdit        = hasPermission("change_member");

  const titleOptions = lookups.filter((l) => l.type === "board_title");

  const tabs = [
    { id: "overview",     label: "Overview",    icon: <User />,        path: `/members/${id}/overview` },
    { id: "reports",      label: "Reports",      icon: <FileText />,    path: `/members/${id}/reports`,      visible: canViewReports },
    { id: "documents",    label: "Documents",    icon: <FolderOpen />,  path: `/members/${id}/documents`,    visible: canViewFiles },
    { id: "church-users", label: "Church Users", icon: <Users />,       path: `/members/${id}/church-users`, visible: canManageUsers },
    { id: "settings",     label: "Settings",     icon: <ShieldAlert />, path: `/members/${id}/settings`,     visible: canDeactivate },
  ];
  const visibleTabs = tabs.filter((t) => t.visible !== false);
  const currentPath = `/members/${id}/overview`;

  const boardMembers: BoardMemberRow[] = (member as any)?.boardMembers || [];

  // ── persist helpers ────────────────────────────────────────────────────────
  const persist = useCallback(async (nextList: BoardMemberRow[]) => {
    await updateMember({
      id,
      data: {
        boardMembers: nextList.map((bm) => ({
          id:          bm.id,
          fullName:    bm.fullName,
          fullNameEn:  bm.fullNameEn,
          phoneNumber: bm.phoneNumber,
          titleId:     bm.titleId,
          isActive:    bm.isActive ?? true,
        })),
      },
    });
  }, [id, updateMember]);

  // ── open drawer ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setDraft(EMPTY);
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEdit = (bm: BoardMemberRow) => {
    setDraft({
      id:          bm.id,
      fullName:    bm.fullName,
      fullNameEn:  bm.fullNameEn || "",
      phoneNumber: bm.phoneNumber,
      titleId:     bm.titleId || bm.title?.id || "",
      isActive:    bm.isActive ?? true,
    });
    setFormError(null);
    setDrawerOpen(true);
  };

  // ── save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft.fullName.trim()) { setFormError("Name (Amharic) is required."); return; }
    if (!draft.phoneNumber.trim()) { setFormError("Phone number is required."); return; }
    if (!draft.titleId) { setFormError("Title is required."); return; }

    let next: BoardMemberRow[];
    if (draft.id) {
      // editing existing
      next = boardMembers.map((bm) =>
        bm.id === draft.id
          ? { ...bm, fullName: draft.fullName, fullNameEn: draft.fullNameEn, phoneNumber: draft.phoneNumber, titleId: draft.titleId, isActive: draft.isActive }
          : bm
      );
    } else {
      // adding new
      const tempId = Math.random().toString(36).substr(2, 9);
      next = [...boardMembers, { id: tempId, fullName: draft.fullName, fullNameEn: draft.fullNameEn, phoneNumber: draft.phoneNumber, titleId: draft.titleId, isActive: draft.isActive }];
    }

    await persist(next);
    setDrawerOpen(false);
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (bmId: string) => {
    await persist(boardMembers.filter((bm) => bm.id !== bmId));
  };

  const handleToggleStatus = async (bmId: string) => {
    try {
      await patch(`/members/${id}/board-members/${bmId}/toggle-status`, {});
      // Refresh the page or invalidate queries to get the new status
      window.location.reload(); 
    } catch (error) {
      console.error("Failed to toggle board member status", error);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) return <div className="p-10 text-center animate-pulse">Loading...</div>;
  if (!member)   return <div className="p-10 text-center text-zinc-500">Member not found.</div>;

  const isEditing = !!draft.id;

  return (
    <>
      {/* Document Warning */}
      {documentCompleteness && !documentCompleteness.isComplete && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              {documentCompleteness.missingDocuments.length} required document
              {documentCompleteness.missingDocuments.length > 1 ? "s" : ""} missing
            </p>
            <button
              onClick={() => router.push(`/members/${id}/documents`)}
              className="text-sm text-amber-700 dark:text-amber-300 hover:underline mt-1"
            >
              View Documents →
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation + Content */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => router.push(tab.path)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative
                  ${currentPath === tab.path
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
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

        {/* Contact Person */}
        {(member as any)?.contactPerson && (
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-zinc-400" />
              ዋና ተወካይ (Contact Person)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">ሙሉ ስም (Full Name)</p>
                  <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{(member as any).contactPerson.fullName}</p>
               </div>
               <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">ስልክ (Phone)</p>
                  <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-zinc-400" />
                    {(member as any).contactPerson.phoneNumber}
                  </p>
               </div>
               {(member as any).contactPerson.email && (
                 <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">ኢሜይል (Email)</p>
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{(member as any).contactPerson.email}</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Board Members */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-400" />
              Board Members
              {boardMembers.length > 0 && (
                <span className="ml-1 text-xs font-normal text-zinc-400">({boardMembers.length})</span>
              )}
            </h3>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={openAdd} className="h-7 px-3 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Member
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boardMembers.map((bm) => (
              <Card
                key={bm.id}
                className="bg-white dark:bg-zinc-900/50 hover:border-blue-200 dark:hover:border-blue-900 transition-colors group"
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {bm.fullName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                        {bm.fullName}
                      </p>
                      {bm.title?.description && (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-medium border border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
                          {bm.title.note
                            ? `${bm.title.description} (${bm.title.note})`
                            : bm.title.description}
                        </span>
                      )}
                    </div>
                    {bm.fullNameEn && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mb-1">{bm.fullNameEn}</p>
                    )}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      {bm.phoneNumber || "No phone provided"}
                    </p>
                  </div>
                  {canEdit && (
                    <RowActions
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-col"
                      actions={[
                        {
                          key: "toggle-status",
                          icon: ShieldAlert,
                          label: bm.isActive ? "Deactivate" : "Activate",
                          onClick: () => handleToggleStatus(bm.id),
                          allowed: canEdit,
                          disabled: saving,
                        },
                        presets.edit({ onClick: () => openEdit(bm), allowed: canEdit, disabled: saving }),
                        presets.delete({
                          onClick: () => handleDelete(bm.id),
                          allowed: canEdit,
                          confirm: "Remove this board member?",
                          disabled: saving,
                        }),
                      ]}
                    />
                  )}
                </CardContent>
                {!bm.isActive && (
                  <div className="bg-red-50 dark:bg-red-950/20 px-4 py-2 text-xs text-red-600 dark:text-red-400 border-t border-red-100 dark:border-red-900/50 flex items-center justify-center">
                    Inactive
                  </div>
                )}
              </Card>
            ))}
          </div>

          {boardMembers.length === 0 && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-500 text-sm">No board members yet.</p>
              {canEdit && (
                <button
                  onClick={openAdd}
                  className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + Add the first board member
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Board Member Drawer ─────────────────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={isEditing ? "Edit Board Member" : "Add Board Member"}
        description={
          isEditing
            ? "Update this board member's details."
            : "Add a new board member to this organisation."
        }
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDrawerOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button form="board-member-form" type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Member"}
            </Button>
          </>
        }
      >
        <form
          id="board-member-form"
          onSubmit={(e) => { e.preventDefault(); handleSave(); }}
          className="space-y-5"
          noValidate
        >
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm">
              {formError}
            </div>
          )}

          <FormField id="bm-title" label="Title" required>
            <Select
              id="bm-title"
              value={draft.titleId}
              onChange={(e) => setDraft((p) => ({ ...p, titleId: e.target.value }))}
            >
              <option value="">Select Title...</option>
              {titleOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.note ? `${t.description} (${t.note})` : t.description}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField id="bm-name" label="ስም (Amharic)" required>
            <Input
              id="bm-name"
              value={draft.fullName}
              onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="ሙሉ ስም"
            />
          </FormField>

          <FormField id="bm-name-en" label="Name (English)">
            <Input
              id="bm-name-en"
              value={draft.fullNameEn}
              onChange={(e) => setDraft((p) => ({ ...p, fullNameEn: e.target.value }))}
              placeholder="Full name in English"
            />
          </FormField>

          <FormField id="bm-phone" label="Phone" required>
            <PhoneInput
              id="bm-phone"
              value={draft.phoneNumber}
              onChange={(val) => setDraft((p) => ({ ...p, phoneNumber: val }))}
            />
          </FormField>

          <FormField id="bm-status" label="Status">
            <div className="flex items-center gap-3 h-10">
              <input
                id="bm-status"
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft((p) => ({ ...p, isActive: e.target.checked }))}
                className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {draft.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </FormField>
        </form>
      </Drawer>
    </>
  );
}
