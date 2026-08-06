"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Plus, Trash2, ShieldCheck, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import {
  PageHeader, Button, Badge, Modal, ModalFooter,
  FormField, Input,
} from "@/components/ui";
import { useRoles, usePermissions, useCreateRole, useDeleteRole, useUpdateRole } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// Group permissions by category prefix (first segment before "_")
function groupPermissions(permissions: any[]) {
  return permissions.reduce((acc: Record<string, any[]>, p) => {
    const category = p.codeName.split("_")[0];
    if (!acc[category]) acc[category] = [];
    acc[category].push(p);
    return acc;
  }, {});
}

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const canAdd    = hasPermission("add_role");
  const canDelete = hasPermission("delete_role");
  const canEdit   = hasPermission("change_role");

  const { data: roles = [], isLoading, refetch, isFetching } = useRoles();
  const { mutateAsync: deleteRole, isPending: deleting } = useDeleteRole();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Management"
        description={`${roles.length} roles configured`}
        actions={
          <>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            {canAdd && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Role
              </Button>
            )}
          </>
        }
      />

      {/* Role list with expandable permissions */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-zinc-500 animate-pulse">Loading roles…</div>
        ) : roles.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <ShieldCheck className="h-10 w-10 mx-auto text-zinc-300 mb-3" />
            <p>No roles found. Create your first role.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {roles.map((role: any) => (
              <div key={role.id}>
                {/* Role Row */}
                <div className="flex items-center justify-between px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">{role.name}</p>
                      {role.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{role.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block">
                      {role.permissions?.length ?? 0} permissions
                    </span>
                    {role.type?.description && (
                      <Badge variant="secondary">{role.type.description}</Badge>
                    )}
                    <button
                      onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      {expandedRole === role.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => setDeleteTarget(role)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Permissions */}
                {expandedRole === role.id && (
                  <div className="px-4 pb-4 bg-zinc-50/50 dark:bg-zinc-950/30 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between pt-3 pb-2">
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                        Assigned Permissions
                      </p>
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditTarget(role)}
                          className="h-7 text-xs gap-1.5"
                        >
                          <Pencil className="h-3 w-3" /> Edit Permissions
                        </Button>
                      )}
                    </div>
                    {role.permissions?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((p: any) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium font-mono"
                          >
                            {p.codeName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-400">No permissions assigned.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      <CreateRoleModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Edit Permissions Modal */}
      {editTarget && (
        <EditPermissionsModal
          role={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Role"
        description={`Are you sure you want to delete the "${deleteTarget?.name}" role? This cannot be undone.`}
        size="sm"
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="danger"
            disabled={deleting}
            onClick={async () => {
              await deleteRole(deleteTarget.id);
              setDeleteTarget(null);
            }}
          >
            {deleting ? "Deleting…" : "Delete Role"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ─── Edit Permissions Modal ──────────────────────────────────────────────────
function EditPermissionsModal({ role, onClose }: { role: any; onClose: () => void }) {
  const { data: allPermissions = [] } = usePermissions();
  const { mutateAsync: updateRole, isPending } = useUpdateRole();
  const [selected, setSelected] = useState<string[]>([]);

  // Seed selection from current role permissions
  useEffect(() => {
    setSelected(role.permissions?.map((p: any) => p.id) ?? []);
  }, [role]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelected(allPermissions.map((p: any) => p.id));
  const clearAll  = () => setSelected([]);

  const grouped = groupPermissions(allPermissions);

  const handleSave = async () => {
    try {
      await updateRole({ id: role.id, permissions: selected });
      onClose();
    } catch {}
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit Permissions — ${role.name}`}
      description="Toggle permissions to grant or revoke access for this role."
      size="lg"
    >
      <div className="space-y-4">
        {/* Quick actions */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            <span className="font-semibold text-zinc-800 dark:text-white">{selected.length}</span>
            {" "}of {allPermissions.length} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={selectAll} className="h-7 text-xs">Select All</Button>
            <Button size="sm" variant="outline" onClick={clearAll} className="h-7 text-xs">Clear All</Button>
          </div>
        </div>

        {/* Permission groups */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1 rounded-lg">
          {Object.entries(grouped).map(([category, perms]) => {
            const groupIds = (perms as any[]).map((p) => p.id);
            const allSelected = groupIds.every((id) => selected.includes(id));
            const someSelected = groupIds.some((id) => selected.includes(id));

            const toggleGroup = () => {
              if (allSelected) {
                setSelected((prev) => prev.filter((id) => !groupIds.includes(id)));
              } else {
                setSelected((prev) => [...new Set([...prev, ...groupIds])]);
              }
            };

            return (
              <div key={category} className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3">
                {/* Group header with toggle all */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 capitalize">
                    {category}
                  </p>
                  <button
                    type="button"
                    onClick={toggleGroup}
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded transition-colors",
                      allSelected
                        ? "text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
                        : someSelected
                        ? "text-amber-600 dark:text-amber-400 hover:text-amber-800"
                        : "text-zinc-400 hover:text-zinc-600"
                    )}
                  >
                    {allSelected ? "Deselect all" : "Select all"}
                  </button>
                </div>

                {/* Permission chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(perms as any[]).map((p: any) => {
                    const isSelected = selected.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => toggle(p.id)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition-all border",
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                            : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-indigo-200 hover:bg-indigo-50/30"
                        )}
                      >
                        {p.codeName}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save Permissions"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ─── Create Role Modal ─────────────────────────────────────────────────────────
function CreateRoleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: permissions = [] } = usePermissions();
  const { mutateAsync: createRole, isPending } = useCreateRole();
  const [form, setForm] = useState({ name: "", description: "", permissions: [] as string[] });
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const togglePermission = (id: string) => {
    setForm((p) => ({
      ...p,
      permissions: p.permissions.includes(id)
        ? p.permissions.filter((pid) => pid !== id)
        : [...p.permissions, id],
    }));
  };

  const grouped = groupPermissions(permissions);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await createRole(form);
      onClose();
      setForm({ name: "", description: "", permissions: [] });
    } catch {}
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Role" description="Define a role and assign permissions." size="lg">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <FormField id="rl-name" label="Role Name" error={errors.name} required>
            <Input id="rl-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Fellowship Manager" />
          </FormField>
          <FormField id="rl-desc" label="Description">
            <Input id="rl-desc" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Short description…" />
          </FormField>
        </div>

        {/* Permission picker */}
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Permissions
            <span className="ml-2 text-xs font-normal text-zinc-400">({form.permissions.length} selected)</span>
          </p>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
            {Object.entries(grouped).map(([category, perms]) => (
              <div key={category}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2 capitalize">
                  {category}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(perms as any[]).map((p: any) => {
                    const selected = form.permissions.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => togglePermission(p.id)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition-all border",
                          selected
                            ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                            : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-indigo-200"
                        )}
                      >
                        {p.codeName}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending}>{isPending ? "Creating…" : "Create Role"}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
