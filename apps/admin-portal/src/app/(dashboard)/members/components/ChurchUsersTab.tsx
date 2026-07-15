"use client";

import React, { useState } from "react";
import { UserPlus, MoreVertical, Edit, Trash2, Key, Shield, Search, RefreshCw } from "lucide-react";
import { Button, DataTable, Badge, Modal, ModalFooter, FormField, Input, Select } from "@/components/ui";
import type { Column } from "@/components/ui";
import { useChurchUsersByMember, useCreateChurchUser, useDeleteChurchUser, useResetUserPassword, useToggleUserStatus, type ChurchUser } from "@/hooks/useChurchUsers";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

interface ChurchUsersTabProps {
  member: any;
}

export function ChurchUsersTab({ member }: ChurchUsersTabProps) {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChurchUser | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<ChurchUser | null>(null);

  const canAdd = hasPermission("add_church_user");
  const canEdit = hasPermission("edit_church_user");
  const canDelete = hasPermission("delete_church_user");
  const canResetPassword = hasPermission("reset_church_user_password");

  const { data, isLoading, refetch, isFetching } = useChurchUsersByMember(member.id, {
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });

  const churchUsers = data?.churchUsers ?? [];
  const total = data?.total ?? 0;

  const { mutateAsync: createUser, isPending: creating } = useCreateChurchUser();
  const { mutateAsync: deleteUser, isPending: deleting } = useDeleteChurchUser();
  const { mutateAsync: resetPassword, isPending: resetting } = useResetUserPassword();
  const { mutateAsync: toggleStatus, isPending: toggling } = useToggleUserStatus();

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordTarget) return;
    try {
      const newPassword = Math.random().toString(36).substring(2, 12);
      await resetPassword({ id: resetPasswordTarget.id, newPassword });
      alert(`New password: ${newPassword}`);
      setResetPasswordTarget(null);
    } catch (error) {
      console.error("Failed to reset password:", error);
    }
  };

  const handleToggleStatus = async (user: ChurchUser) => {
    try {
      await toggleStatus(user.id);
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  const COLUMNS: Column<ChurchUser>[] = [
    {
      key: "name",
      header: "User",
      cell: (row) => (
        <div>
          <p className="font-medium text-zinc-900 dark:text-white">
            {row.firstName} {row.lastName}
          </p>
          <p className="text-sm text-zinc-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => (
        <Badge variant={row.role === "ADMIN" ? "default" : row.role === "EDITOR" ? "secondary" : "outline"}>
          {row.role}
        </Badge>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => <span className="text-zinc-600 dark:text-zinc-400">{row.phone || "—"}</span>,
    },
    {
      key: "lastLogin",
      header: "Last Login",
      cell: (row) => (
        <span className="text-sm text-zinc-500">
          {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : "Never"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.isActive ? "success" : "danger"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right w-24",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          {canResetPassword && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResetPasswordTarget(row)}
              className="h-8 w-8 p-0"
              title="Reset Password"
            >
              <Key className="h-4 w-4" />
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(row)}
              className="h-8 w-8 p-0"
              title={row.isActive ? "Deactivate" : "Activate"}
            >
              <Shield className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(row)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              title="Delete User"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Church Users</h3>
          <p className="text-sm text-zinc-500">
            {total} user{total !== 1 ? "s" : ""} for this church
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
          {canAdd && (
            <Button onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search users by name or email..."
          className="pl-9"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <DataTable<ChurchUser>
        columns={COLUMNS}
        data={churchUsers}
        isLoading={isLoading}
        skeletonRows={PAGE_SIZE}
        rowKey={(row) => row.id}
        emptyTitle="No church users found"
        emptyDescription="Add your first church user to get started."
      />

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="mx-4 self-center text-sm text-zinc-600">
            Page {page} of {Math.ceil(total / PAGE_SIZE)}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= Math.ceil(total / PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Church User"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-zinc-600">
            Are you sure you want to delete <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>?
            This action will deactivate their account and they will no longer be able to access the church portal.
          </p>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete User"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={!!resetPasswordTarget}
        onClose={() => setResetPasswordTarget(null)}
        title="Reset Password"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-zinc-600">
            Reset password for <strong>{resetPasswordTarget?.firstName} {resetPasswordTarget?.lastName}</strong>?
            A new random password will be generated and displayed.
          </p>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setResetPasswordTarget(null)}>
            Cancel
          </Button>
          <Button
            onClick={handleResetPassword}
            disabled={resetting}
          >
            {resetting ? "Resetting..." : "Reset Password"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add User Modal */}
      <AddChurchUserModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        memberId={member.id}
      />
    </div>
  );
}

// Add Church User Modal Component
function AddChurchUserModal({ open, onClose, memberId }: { open: boolean; onClose: () => void; memberId: string }) {
  const { mutateAsync: createUser, isPending } = useCreateChurchUser();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "VIEWER" as "ADMIN" | "EDITOR" | "VIEWER",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createUser({ ...formData, memberId });
      alert(`User created successfully!\nTemporary password: ${result.temporaryPassword}`);
      onClose();
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "VIEWER",
      });
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("Failed to create user. Please try again.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Church User" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="firstName" label="First Name" required>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Enter first name"
          />
        </FormField>
        <FormField id="lastName" label="Last Name" required>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Enter last name"
          />
        </FormField>
        <FormField id="email" label="Email" required>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
          />
        </FormField>
        <FormField id="phone" label="Phone">
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter phone number"
          />
        </FormField>
        <FormField id="role" label="Role">
          <Select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
          >
            <option value="VIEWER">Viewer - Read only access</option>
            <option value="EDITOR">Editor - Can edit and submit reports</option>
            <option value="ADMIN">Admin - Full access</option>
          </Select>
        </FormField>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create User"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
