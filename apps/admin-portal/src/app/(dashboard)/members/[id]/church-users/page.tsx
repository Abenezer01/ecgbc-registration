"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserPlus, Key, Shield, Search, RefreshCw, User, FileText, FolderOpen, Users as UsersIcon, ShieldAlert , History } from "lucide-react";
import { Button, DataTable, Badge, Modal, ModalFooter, FormField, Input, Select } from "@/components/ui";
import type { Column } from "@/components/ui";
import { useChurchUsersByMember, useCreateChurchUser, useDeleteChurchUser, useResetUserPassword, useToggleUserStatus, type ChurchUser } from "@/hooks/useChurchUsers";
import { useAuth } from "@/hooks/useAuth";
import { useMember } from "@/hooks/useMembers";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function ChurchUsersPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: member, isLoading: memberLoading } = useMember(id);
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChurchUser | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<ChurchUser | null>(null);

  const canViewFiles = hasPermission("view_file") || hasPermission("view_member");
  const canViewReports = hasPermission("view_report") || hasPermission("view_member");
  const canManageUsers = hasPermission("view_church_user") || hasPermission("view_member");
  const canDeactivate = hasPermission("deactivate_member") || hasPermission("delete_member");

  const tabs = [
    { id: "overview", label: "Overview", icon: <User />, path: `/members/${id}/overview` },
    { id: "reports", label: "Reports", icon: <FileText />, path: `/members/${id}/reports`, visible: canViewReports },
    { id: "documents", label: "Documents", icon: <FolderOpen />, path: `/members/${id}/documents`, visible: canViewFiles },
    { id: "church-users", label: "Church Users", icon: <UsersIcon />, path: `/members/${id}/church-users`, visible: canManageUsers },
    { id: "history", label: "History", icon: <History />, path: `/members/${id}/history` },
    { id: "settings", label: "Settings", icon: <ShieldAlert />, path: `/members/${id}/settings`, visible: canDeactivate },
  ];

  const visibleTabs = tabs.filter(tab => tab.visible !== false);
  const currentPath = `/members/${id}/church-users`;

  const canAdd = hasPermission("add_church_user");
  const canEdit = hasPermission("edit_church_user");
  const canDelete = hasPermission("delete_church_user");
  const canResetPassword = hasPermission("reset_church_user_password");

  const { data, isLoading, refetch, isFetching } = useChurchUsersByMember(id, {
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });

  const churchUsers = data?.churchUsers ?? [];
  const total = data?.total ?? 0;

  const { mutateAsync: deleteUser, isPending: deleting } = useDeleteChurchUser();
  const { mutateAsync: resetPassword, isPending: resetting } = useResetUserPassword();
  const { mutateAsync: toggleStatus } = useToggleUserStatus();

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
      // Generate a password that meets validation requirements (uppercase, lowercase, number, min 6 chars)
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let newPassword = "";
      for (let i = 0; i < 10; i++) {
        newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
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
              <Shield className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (memberLoading) {
    return <div className="p-10 text-center animate-pulse">Loading...</div>;
  }

  if (!member) {
    return (
      <div className="p-10 text-center text-zinc-500">
        Member not found.
      </div>
    );
  }

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
                  ${currentPath === tab.path 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
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

        {/* Tab Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Church Users</h2>
              <p className="text-sm text-zinc-500">{total} user{total !== 1 ? "s" : ""} for this church</p>
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
          <div className="relative mb-4">
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
            <div className="flex justify-center mt-4">
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
        </div>
      </div>

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
        memberId={id}
      />
    </>
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
