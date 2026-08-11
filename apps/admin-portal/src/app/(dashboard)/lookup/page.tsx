"use client";

import React, { useState } from "react";
import { Search, RefreshCw, Plus, Trash2, Pencil, Sliders } from "lucide-react";
import {
  PageHeader, Button, Input, Badge, DataTable,
  Modal, ModalFooter, FormField, Select, Checkbox,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import {
  useDataLookups,
  useCreateDataLookup,
  useUpdateDataLookup,
  useDeleteDataLookup,
  useUpdateDocumentRequirement,
  type DataLookup,
} from "@/hooks/useDataLookups";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// Mapping category code to user-friendly names
const CATEGORY_META: Record<string, { label: string; description: string }> = {
  object_state: {
    label: "Status States (Object States)",
    description: "System-wide database record states like Active, Inactive, Draft, and Deleted.",
  },
  member_type: {
    label: "Member Institution Types",
    description: "Classification of registered institutions (e.g., Church, Ministry).",
  },
  region: {
    label: "Geographic Regions",
    description: "States and regions inside Ethiopia used for mapping fellowships.",
  },
  report_state: {
    label: "Report Workflow Statuses",
    description: "Progress labels for annual fellowship reports (e.g. Pending, Approved).",
  },
  role_type: {
    label: "Access Control Roles",
    description: "System access tiers such as Owner, Board Member, or Standard staff.",
  },
  FILE_TYPE: {
    label: "File Document Types",
    description: "Document classifications and whether each one is required for member completeness.",
  },
  file_type: {
    label: "File Document Types",
    description: "Document classifications and whether each one is required for member completeness.",
  },
  "Document Type": {
    label: "File Document Types",
    description: "Document classifications and whether each one is required for member completeness.",
  },
};

function isFileTypeLookup(lookup: Pick<DataLookup, "type" | "category">) {
  return lookup.type === "FILE_TYPE" || lookup.type === "file_type" || lookup.category === "FILE_TYPE";
}

function categoryForType(type: string) {
  if (type === "Document Type" || type === "FILE_TYPE" || type === "file_type") return "FILE_TYPE";
  if (type === "Report Type" || type === "REPORT_TYPE") return "REPORT_TYPE";
  return type;
}

export default function LookupPage() {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DataLookup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DataLookup | null>(null);

  const canAdd = hasPermission("add_permission");
  const canEdit = hasPermission("change_permission");
  const canDelete = hasPermission("delete_permission");

  const { data: lookups = [], isLoading, refetch, isFetching } = useDataLookups();
  const { mutateAsync: createLookup, isPending: creating } = useCreateDataLookup();
  const { mutateAsync: updateLookup, isPending: updating } = useUpdateDataLookup();
  const { mutateAsync: deleteLookup, isPending: deleting } = useDeleteDataLookup();
  // updateRequirement handled by inline API calls

  // Get list of unique types
  const uniqueTypes = Array.from(new Set(lookups.map((item) => item.type))).sort();

  // Client side search and filter
  const filteredLookups = lookups.filter((item) => {
    const matchesSearch =
      item.value.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase());

    const matchesType = activeTab === "all" || item.type === activeTab;
    return matchesSearch && matchesType;
  });

  const COLUMNS: Column<DataLookup>[] = [
    {
      key: "value",
      header: "System Value (Code)",
      cell: (row) => (
        <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {row.value}
        </span>
      ),
    },
    {
      key: "description",
      header: "Display Label (Description)",
      cell: (row) => (
        <span className="text-zinc-700 dark:text-zinc-300 font-medium">
          {row.description}
        </span>
      ),
    },
    {
      key: "type",
      header: "Technical Category",
      cell: (row) => (
        <span className="font-mono text-xs px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          {row.type}
        </span>
      ),
    },
    ...(filteredLookups.some(isFileTypeLookup) ? [{
      key: "required",
      header: "Required",
      cell: (row: DataLookup) =>
        isFileTypeLookup(row) ? (
          <Checkbox
            id={`required-${row.id}`}
            checked={!!row.isRequired}
            disabled={!canEdit || updating}
            onClick={(event) => event.stopPropagation()}
            onChange={(e) => {
              updateLookup({
                id: row.id,
                isRequired: e.target.checked,
              });
            }}
            aria-label={`Mark ${row.description} as required`}
          />
        ) : (
          <span className="text-zinc-400">-</span>
        ),
    }] : []),
    ...(canEdit || canDelete ? [{
      key: "actions",
      header: "",
      className: "text-right w-24",
      cell: (row: DataLookup) => (
        <div className="flex items-center gap-2 justify-end">
          {canEdit && (
            <button
              onClick={() => {
                setEditTarget(row);
                setModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="Edit lookup"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete lookup"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data Manager"
        description="Configure reference data, enumerations, drop-down labels, and workflow status rules."
        actions={
          <>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            {canAdd && activeTab !== "all" && (
              <Button onClick={() => {
                setEditTarget(null);
                setModalOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" /> Add Record
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sidebar Menu */}
        <div className="md:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm self-start">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Data Categories</h3>
          </div>
          <nav className="flex flex-col" aria-label="Master Data Categories">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "w-full text-left px-4 py-3 text-sm font-medium transition-colors border-l-2 flex justify-between items-center",
                activeTab === "all"
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500"
                  : "border-transparent text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:bg-zinc-800/50"
              )}
            >
              All Categories
              <Badge variant="secondary">{lookups.length}</Badge>
            </button>
            {uniqueTypes.map((type) => {
              const meta = CATEGORY_META[type] || { label: type, description: "" };
              const count = lookups.filter((item) => item.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={cn(
                    "w-full text-left px-4 py-3 text-sm font-medium transition-colors border-l-2 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800",
                    activeTab === type
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500"
                      : "border-transparent text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <span className="truncate">{meta.label}</span>
                  <Badge variant="secondary" className="ml-2">{count}</Badge>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Panel Content */}
        <div className="md:col-span-3 space-y-4">
          {/* Tab description card */}
          {activeTab !== "all" && CATEGORY_META[activeTab] && (
            <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/30 p-4 rounded-xl flex items-start gap-3">
              <Sliders className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <h5 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                  {CATEGORY_META[activeTab].label} Reference Data
                </h5>
                <p className="text-xs text-blue-700 dark:text-blue-300/80 mt-1">
                  {CATEGORY_META[activeTab].description}
                </p>
              </div>
            </div>
          )}

          {/* Filter Ribbon */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <Input
                placeholder="Search within this category by code or label..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {canAdd && activeTab === "all" && (
              <Button onClick={() => {
                setEditTarget(null);
                setModalOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" /> Add Record
              </Button>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
            <DataTable<DataLookup>
              columns={COLUMNS}
              data={filteredLookups}
              isLoading={isLoading}
              rowKey={(row) => row.id}
              emptyTitle="No lookups found"
              emptyDescription="Create a new lookup entry or adjust filters."
            />
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <LookupFormModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditTarget(null);
          }}
          editTarget={editTarget}
          onSubmit={async (val) => {
            if (editTarget) {
              await updateLookup({ id: editTarget.id, ...val });
            } else {
              await createLookup(val);
            }
            refetch();
            setModalOpen(false);
            setEditTarget(null);
          }}
          isSubmitting={editTarget ? updating : creating}
          existingTypes={uniqueTypes}
          initialType={activeTab !== "all" ? activeTab : ""}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Lookup Entry"
        description={`Are you sure you want to delete "${deleteTarget?.description || deleteTarget?.value}"? This may affect items using this option.`}
        size="sm"
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="danger"
            disabled={deleting}
            onClick={async () => {
              if (deleteTarget) {
                await deleteLookup({ id: deleteTarget.id });
                setDeleteTarget(null);
              }
            }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ─── Lookup Form Modal Component ───────────────────────────────────────────
interface LookupFormModalProps {
  open: boolean;
  onClose: () => void;
  editTarget: DataLookup | null;
  onSubmit: (values: Omit<DataLookup, "id" | "documentRequirement"> & {
    isRequired?: boolean;
    requirementNote?: string;
    appliesTo?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  existingTypes: string[];
  initialType?: string;
}

function LookupFormModal({
  open,
  onClose,
  editTarget,
  onSubmit,
  isSubmitting,
  existingTypes,
  initialType,
}: LookupFormModalProps) {
  const [form, setForm] = useState({
    type: editTarget?.type || initialType || "",
    category: editTarget?.category || categoryForType(initialType || ""),
    value: editTarget?.value || "",
    description: editTarget?.description || "",
    isRequired: !!editTarget?.isRequired,
    requirementNote: editTarget?.documentRequirement?.note || "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [customTypeMode, setCustomTypeMode] = useState(!editTarget?.type && !initialType);

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.type.trim()) e.type = "Type/Category is required";
    if (!form.value.trim()) e.value = "Value code is required";
    if (!form.description.trim()) e.description = "Display label is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError(null);
    try {
      await onSubmit({
        ...form,
        category: form.category || categoryForType(form.type),
        appliesTo: "member",
      });
      // onSubmit in parent handles close + refetch
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        "Something went wrong. Please try again.";
      setApiError(msg);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editTarget ? "Edit Lookup Entry" : "Create Lookup Entry"}
      description="System lookups store dynamic application enumerations and lists."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {apiError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>{apiError}</span>
          </div>
        )}
        {/* Category Selector / Input */}
        <FormField id="lk-type" label="Category Type" error={errors.type} required>
          {customTypeMode ? (
            <div className="flex gap-2">
              <Input
                id="lk-type"
                placeholder="e.g. object_state, region, member_type"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value, category: categoryForType(e.target.value) }))}
                className="flex-1"
              />
              {existingTypes.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCustomTypeMode(false)}
                >
                  Choose Existing
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Select
                id="lk-type"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value, category: categoryForType(e.target.value) }))}
                className="flex-1"
              >
                <option value="">Select Category...</option>
                {existingTypes.map((t) => (
                  <option key={t} value={t}>{(CATEGORY_META[t]?.label) || t}</option>
                ))}
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCustomTypeMode(true);
                  setForm((p) => ({ ...p, type: "", category: "" }));
                }}
              >
                + Custom
              </Button>
            </div>
          )}
        </FormField>

        {/* Code Value */}
        <FormField id="lk-value" label="Code Value" error={errors.value} required>
          <Input
            id="lk-value"
            placeholder="e.g. object_state_inactive"
            value={form.value}
            onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
          />
        </FormField>

        {/* Description */}
        <FormField id="lk-desc" label="Display Label" error={errors.description} required>
          <Input
            id="lk-desc"
            placeholder="e.g. Inactive"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </FormField>

        {isFileTypeLookup({ type: form.type, category: form.category }) && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
            <Checkbox
              id="lk-required"
              label="Required for member document completeness"
              checked={form.isRequired}
              onChange={(e) => setForm((p) => ({ ...p, isRequired: e.target.checked }))}
            />
            <FormField id="lk-requirement-note" label="Requirement Note">
              <Input
                id="lk-requirement-note"
                placeholder="Optional internal note"
                value={form.requirementNote}
                onChange={(e) => setForm((p) => ({ ...p, requirementNote: e.target.value }))}
              />
            </FormField>
          </div>
        )}

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editTarget ? "Save Changes" : "Create Entry"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}