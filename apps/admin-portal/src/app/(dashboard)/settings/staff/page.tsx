"use client";

import React, { useState } from "react";
import { UserCog, Search, RefreshCw, Plus, Trash2, Pencil, Shield, Building2 } from "lucide-react";
import {
  PageHeader, Button, Input, Badge, Avatar, DataTable,
  Pagination, Modal, ModalFooter, FormField, Select, MultiSelect,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import { useStaffList, useCreateStaff, useDeleteStaff, useUpdateStaff, useUpdateFellowships } from "@/hooks/useStaff";
import { useRoles } from "@/hooks/useRoles";
import { useFellowships } from "@/hooks/useFellowships";
import { useAuth } from "@/hooks/useAuth";
import type { Staff } from "@/types";

const PAGE_SIZE = 20;

export default function StaffPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Staff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);

  const canAdd    = hasPermission("add_staff");
  const canEdit   = hasPermission("change_staff");
  const canDelete = hasPermission("delete_staff");

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__staffSearchTimer);
    (window as any).__staffSearchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 350);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { data, isLoading, refetch, isFetching } = useStaffList({
    page, limit: PAGE_SIZE, search: debouncedSearch || undefined,
  });
  const { mutateAsync: deleteStaff, isPending: deleting } = useDeleteStaff();

  const staff: Staff[] = data?.staff ?? [];
  const total: number = data?.total ?? 0;

  const COLUMNS: Column<Staff>[] = [
    {
      key: "name",
      header: "Staff Member",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={row.avatar}
            fallback={`${row.firstName?.[0] ?? ""}${row.lastName?.[0] ?? ""}`}
            size="sm"
          />
          <div>
            <p className="font-medium text-zinc-900 dark:text-white">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => <span className="text-zinc-600 dark:text-zinc-400">{row.phoneNumber || "—"}</span>,
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => row.role?.name
        ? <Badge variant="secondary">{row.role.name}</Badge>
        : <span className="text-zinc-400">—</span>,
    },
    {
      key: "fellowships",
      header: "Fellowships",
      cell: (row) => {
        const fellowshipCount = row.fellowships?.length ?? 0;
        if (fellowshipCount === 0) {
          return <span className="text-zinc-400 text-sm">No assignments</span>;
        }
        return (
          <div className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {fellowshipCount} {fellowshipCount === 1 ? "fellowship" : "fellowships"}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const isActive = row.state?.value !== "INACTIVE";
        return (
          <Badge variant={isActive ? "success" : "danger"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    ...(canEdit || canDelete ? [{
      key: "actions",
      header: "",
      cell: (row: Staff) => (
        <div className="flex items-center gap-2 justify-end">
          {canEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); setEditTarget(row); }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
        title="Staff Management"
        description={`${total.toLocaleString()} staff members registered`}
        actions={
          <>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            {canAdd && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Staff
              </Button>
            )}
          </>
        }
      />

      {/* Search */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable<Staff>
        columns={COLUMNS}
        data={staff}
        isLoading={isLoading}
        skeletonRows={PAGE_SIZE}
        rowKey={(row) => row.id}
        emptyTitle="No staff members found"
        emptyDescription="Add your first staff member to get started."
      />

      {total > PAGE_SIZE && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={handlePageChange} />
      )}

      {/* Create Modal */}
      <CreateStaffModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Edit Modal */}
      {editTarget && (
        <EditStaffModal 
          open={!!editTarget} 
          staff={editTarget}
          onClose={() => setEditTarget(null)} 
        />
      )}

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Staff Member"
        description={`Are you sure you want to remove ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This action cannot be undone.`}
        size="sm"
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="danger"
            disabled={deleting}
            onClick={async () => {
              await deleteStaff(deleteTarget!.id);
              setDeleteTarget(null);
            }}
          >
            {deleting ? "Removing…" : "Remove"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ─── Create Staff Modal ────────────────────────────────────────────────────────
function CreateStaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: roles } = useRoles();
  const { data: fellowshipsData } = useFellowships({ limit: 1000 });
  const { mutateAsync: createStaff, isPending } = useCreateStaff();
  const { mutateAsync: assignFellowships } = useUpdateFellowships();
  
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phoneNumber: "", password: "", roleId: "",
  });
  const [selectedFellowships, setSelectedFellowships] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!form.password.trim()) e.password = "Required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const result = await createStaff(form);
      // Assign fellowships after staff creation
      if (selectedFellowships.length > 0 && result?.staff?.id) {
        await assignFellowships({ staffId: result.staff.id, fellowshipIds: selectedFellowships });
      }
      onClose();
      setForm({ firstName: "", lastName: "", email: "", phoneNumber: "", password: "", roleId: "" });
      setSelectedFellowships([]);
    } catch {}
  };

  const fellowshipOptions = (fellowshipsData?.fellowships ?? []).map((f) => ({
    value: f.id,
    label: f.name,
  }));

  return (
    <Modal open={open} onClose={onClose} title="Add Staff Member" description="Create a new staff account." size="lg">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <FormField id="sf-firstName" label="First name" error={errors.firstName} required>
            <Input id="sf-firstName" value={form.firstName} onChange={set("firstName")} placeholder="John" />
          </FormField>
          <FormField id="sf-lastName" label="Last name" error={errors.lastName} required>
            <Input id="sf-lastName" value={form.lastName} onChange={set("lastName")} placeholder="Doe" />
          </FormField>
        </div>
        <FormField id="sf-email" label="Email" error={errors.email} required>
          <Input id="sf-email" type="email" value={form.email} onChange={set("email")} placeholder="john@example.com" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField id="sf-phone" label="Phone number">
            <Input id="sf-phone" type="tel" value={form.phoneNumber} onChange={set("phoneNumber")} placeholder="+251…" />
          </FormField>
          <FormField id="sf-role" label="Role">
            <Select id="sf-role" value={form.roleId} onChange={set("roleId")} placeholder="Select role…">
              {(roles ?? []).map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </FormField>
        </div>
        <FormField id="sf-password" label="Temporary password" error={errors.password} required>
          <Input id="sf-password" type="text" value={form.password} onChange={set("password")} placeholder="Set a password" />
        </FormField>
        <FormField 
          id="sf-fellowships" 
          label="Fellowship Assignments" 
          hint="Assign fellowships this staff member can manage (leave empty for admin full access)"
        >
          <MultiSelect
            options={fellowshipOptions}
            value={selectedFellowships}
            onChange={setSelectedFellowships}
            placeholder="Select fellowships..."
            searchPlaceholder="Search fellowships..."
          />
        </FormField>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending}>{isPending ? "Creating…" : "Create Staff"}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Edit Staff Modal ──────────────────────────────────────────────────────────
function EditStaffModal({ open, staff, onClose }: { open: boolean; staff: Staff; onClose: () => void }) {
  const { data: roles } = useRoles();
  const { data: fellowshipsData } = useFellowships({ limit: 1000 });
  const { mutateAsync: updateStaff, isPending } = useUpdateStaff();
  const { mutateAsync: updateFellowships, isPending: updatingFellowships } = useUpdateFellowships();
  
  const [form, setForm] = useState({
    firstName: staff.firstName,
    lastName: staff.lastName,
    email: staff.email || "",
    phoneNumber: staff.phoneNumber || "",
    roleId: staff.roleId || "",
  });
  
  const [selectedFellowships, setSelectedFellowships] = useState<string[]>(
    staff.fellowships?.map((f) => f.fellowship.id) ?? []
  );
  
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim()) e.email = "Required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      // Update staff basic info
      await updateStaff({ id: staff.id, ...form });
      
      // Update fellowship assignments
      await updateFellowships({ 
        staffId: staff.id, 
        fellowshipIds: selectedFellowships 
      });
      
      onClose();
    } catch {}
  };

  const fellowshipOptions = (fellowshipsData?.fellowships ?? []).map((f) => ({
    value: f.id,
    label: f.name,
  }));

  return (
    <Modal open={open} onClose={onClose} title="Edit Staff Member" description="Update staff account details and fellowship assignments." size="lg">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <FormField id="ef-firstName" label="First name" error={errors.firstName} required>
            <Input id="ef-firstName" value={form.firstName} onChange={set("firstName")} placeholder="John" />
          </FormField>
          <FormField id="ef-lastName" label="Last name" error={errors.lastName} required>
            <Input id="ef-lastName" value={form.lastName} onChange={set("lastName")} placeholder="Doe" />
          </FormField>
        </div>
        <FormField id="ef-email" label="Email" error={errors.email} required>
          <Input id="ef-email" type="email" value={form.email} onChange={set("email")} placeholder="john@example.com" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField id="ef-phone" label="Phone number">
            <Input id="ef-phone" type="tel" value={form.phoneNumber} onChange={set("phoneNumber")} placeholder="+251…" />
          </FormField>
          <FormField id="ef-role" label="Role">
            <Select id="ef-role" value={form.roleId} onChange={set("roleId")} placeholder="Select role…">
              {(roles ?? []).map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </FormField>
        </div>
        <FormField 
          id="ef-fellowships" 
          label="Fellowship Assignments" 
          hint="Assign fellowships this staff member can manage (leave empty for admin full access)"
        >
          <MultiSelect
            options={fellowshipOptions}
            value={selectedFellowships}
            onChange={setSelectedFellowships}
            placeholder="Select fellowships..."
            searchPlaceholder="Search fellowships..."
          />
        </FormField>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending || updatingFellowships}>
            {isPending || updatingFellowships ? "Saving…" : "Save Changes"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
