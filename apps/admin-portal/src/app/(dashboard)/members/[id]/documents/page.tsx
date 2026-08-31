"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FolderOpen, FileText, Download, Trash2, Eye, Plus,
  CheckCircle2, AlertTriangle, User, Users, ShieldAlert,
  Pencil, UploadCloud, X,
, History } from "lucide-react";
import { Button, Modal, ModalFooter, FormField, Input, Select, Drawer, RowActions, presets } from "@/components/ui";
import {
  useMemberFiles,
  useUploadMemberFiles,
  useDeleteMemberFile,
  useUpdateMemberFile,
} from "@/hooks/useMemberFiles";
import { useAuth } from "@/hooks/useAuth";
import { useDataLookups } from "@/hooks/useDataLookups";
import { fileUrl } from "@/lib/file-url";
import { FileViewer } from "@/components/shared/FileViewer";
import { useRequiredDocumentTypes, useDocumentCompleteness } from "@/hooks/useDocumentCompleteness";
import { useMember } from "@/hooks/useMembers";

interface EditingFile {
  id: string;
  fileName: string;
  categoryId: string;
  newFile: File | null;
}

export default function DocumentsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const memberId = id;

  const { data: member, isLoading: memberLoading } = useMember(id);
  const { data: documentCompleteness } = useDocumentCompleteness(id);
  const { hasPermission } = useAuth();

  // ── permissions ─────────────────────────────────────────────────────────────
  const canViewFiles   = hasPermission("view_file")        || hasPermission("view_member");
  const canViewReports = hasPermission("view_report")      || hasPermission("view_member");
  const canManageUsers = hasPermission("view_church_user") || hasPermission("view_member");
  const canDeactivate  = hasPermission("deactivate_member")|| hasPermission("delete_member");
  const canAdd         = hasPermission("add_file")         || hasPermission("change_member");
  const canEdit        = hasPermission("change_file")      || hasPermission("change_member");
  const canDelete      = hasPermission("delete_file")      || hasPermission("change_member");

  const tabs = [
    { id: "overview",     label: "Overview",      icon: <User />,        path: `/members/${id}/overview` },
    { id: "reports",      label: "Reports",        icon: <FileText />,    path: `/members/${id}/reports`,      visible: canViewReports },
    { id: "documents",    label: "Documents",      icon: <FolderOpen />,  path: `/members/${id}/documents`,    visible: canViewFiles },
    { id: "church-users", label: "Church Users",   icon: <Users />,       path: `/members/${id}/church-users`, visible: canManageUsers },
    { id: "history", label: "History", icon: <History />, path: `/members/${id}/history` },
    { id: "settings",     label: "Settings",       icon: <ShieldAlert />, path: `/members/${id}/settings`,     visible: canDeactivate },
  ];
  const visibleTabs = tabs.filter((t) => t.visible !== false);
  const currentPath = `/members/${id}/documents`;

  // ── upload state ─────────────────────────────────────────────────────────────
  const [uploadOpen, setUploadOpen]           = useState(false);
  const [pendingFiles, setPendingFiles]       = useState<File[]>([]);
  const [uploadError, setUploadError]         = useState<string | null>(null);
  const [selectedFileTypeId, setSelectedFileTypeId] = useState("");

  // ── inline-edit state ────────────────────────────────────────────────────────
  const [editingFile, setEditingFile]         = useState<EditingFile | null>(null);
  const [editError, setEditError]             = useState<string | null>(null);
  const editFileInputRef                      = useRef<HTMLInputElement>(null);

  // ── viewer state ─────────────────────────────────────────────────────────────
  const [viewerOpen, setViewerOpen]           = useState(false);
  const [viewerUrl, setViewerUrl]             = useState<string | null>(null);
  const [viewerName, setViewerName]           = useState<string | null>(null);

  // ── queries & mutations ──────────────────────────────────────────────────────
  const { data: files = [], isLoading, refetch } = useMemberFiles({ memberId, isFromSelamMinster: false });
  const { data: documentTypes = [] }             = useRequiredDocumentTypes();
  const { data: lookups = [] }                   = useDataLookups();
  const { mutateAsync: uploadFiles, isPending: uploading }     = useUploadMemberFiles();
  const { mutateAsync: updateFile,  isPending: updatingFile }  = useUpdateMemberFile();
  const { mutateAsync: deleteFile }                            = useDeleteMemberFile();

  const fileCategoryOptions = lookups.filter((l) => l.type === "Document Type");

  // ── upload handlers ───────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) { setPendingFiles(Array.from(e.target.files)); setUploadError(null); }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingFiles.length === 0)  { setUploadError("Please select at least one file."); return; }
    if (!selectedFileTypeId)        { setUploadError("Please select a document type.");   return; }
    try {
      await uploadFiles({ memberId, files: pendingFiles, fileTypeId: selectedFileTypeId });
      setUploadOpen(false);
      setPendingFiles([]);
      setSelectedFileTypeId("");
      refetch();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || "Failed to upload files.");
    }
  };

  // ── edit handlers ─────────────────────────────────────────────────────────────
  const openEdit = (file: any) => {
    setEditingFile({
      id:         file.id,
      fileName:   file.fileName || "",
      categoryId: file.categoryId || file.category?.id || "",
      newFile:    null,
    });
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editingFile) return;
    if (!editingFile.fileName.trim()) { setEditError("File name is required."); return; }
    try {
      await updateFile({
        fileId:     editingFile.id,
        memberId,
        fileName:   editingFile.fileName.trim(),
        categoryId: editingFile.categoryId || null,
        newFile:    editingFile.newFile,
      });
      setEditingFile(null);
    } catch (err: any) {
      setEditError(err.response?.data?.message || "Failed to update file.");
    }
  };

  // ── delete / view / download ──────────────────────────────────────────────────
  const handleDelete = async (fileId: string) => {
    if (!window.confirm("Delete this file?")) return;
    try { await deleteFile({ fileId, memberId }); refetch(); } catch {}
  };

  const handleDownload = (fileName: string, relativeUrl: string) => {
    const link = document.createElement("a");
    link.href = fileUrl("file", relativeUrl);
    link.download = fileName || "file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerViewer = (relativeUrl: string, name: string) => {
    setViewerUrl(fileUrl("file", relativeUrl));
    setViewerName(name);
    setViewerOpen(true);
  };

  // ── loading / not-found guards ────────────────────────────────────────────────
  if (memberLoading) return <div className="p-10 text-center animate-pulse">Loading...</div>;
  if (!member)       return <div className="p-10 text-center text-zinc-500">Member not found.</div>;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">

        {/* Tab nav */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => router.push(tab.path)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative
                  ${currentPath === tab.path
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
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

        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Required Documents Checklist */}
          {documentCompleteness && documentTypes.length > 0 && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Required Documents</h3>
                <span className="text-xs text-zinc-500">
                  {documentCompleteness.uploadedCount} of {documentCompleteness.totalRequired} completed
                </span>
              </div>
              <div className="space-y-2">
                {documentTypes.map((docType) => {
                  const isUploaded = documentCompleteness.uploadedDocuments.some(
                    (doc: any) => doc.category?.id === docType.id || doc.category?.value === docType.value || doc.fileType?.id === docType.id
                  );
                  const isRequired = !!(docType.documentRequirement?.isRequired ?? docType.isRequired);
                  return (
                    <div key={docType.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      {isUploaded
                        ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        : isRequired
                          ? <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                          : <FileText className="h-5 w-5 text-zinc-400 shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{docType.description}</p>
                        {(docType.documentRequirement?.note || docType.note) && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {docType.documentRequirement?.note || docType.note}
                          </p>
                        )}
                      </div>
                      <span className={
                        isUploaded  ? "text-xs text-green-600 dark:text-green-400 font-medium" :
                        isRequired  ? "text-xs text-amber-600 dark:text-amber-400 font-medium" :
                                      "text-xs text-zinc-400 font-medium"
                      }>
                        {isUploaded ? "Uploaded" : isRequired ? "Required" : "Optional"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Attached Files */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-zinc-400" />
                Attached Files
              </h3>
              {canAdd && (
                <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add File
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-zinc-500 animate-pulse">Loading documents...</div>
            ) : files.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file, idx) => {
                  const categoryLabel = (file as any).category?.description || (file as any).fileType?.description;

                  return (
                    /* ── Display card ─────────────────────────────────── */
                    <div
                      key={file.id || idx}
                      className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4 hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                    >
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          onClick={() => triggerViewer(file.file, file.fileName)}
                          className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                        >
                          {file.fileName || `Document ${idx + 1}`}
                        </p>
                        {categoryLabel && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">{categoryLabel}</p>
                        )}
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">
                          {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                      <RowActions
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        actions={[
                          presets.view({
                            label: "View",
                            onClick: () => triggerViewer(file.file, file.fileName),
                            allowed: true,
                          }),
                          presets.download({
                            onClick: () => handleDownload(file.fileName, file.file),
                            allowed: true,
                          }),
                          presets.edit({
                            onClick: () => openEdit(file),
                            allowed: canEdit,
                          }),
                          presets.delete({
                            onClick: () => handleDelete(file.id),
                            allowed: canDelete,
                            confirm: "Delete this file? This cannot be undone.",
                          }),
                        ]}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-500 text-sm">No files attached yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Member Files" size="md">
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {uploadError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-sm">{uploadError}</div>
          )}
          <FormField id="fileType" label="Document Category" required>
            <select
              id="fileType"
              value={selectedFileTypeId}
              onChange={(e) => setSelectedFileTypeId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select document category...</option>
              {documentTypes.length > 0 && (
                <optgroup label="Required types">
                  {documentTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.description}</option>
                  ))}
                </optgroup>
              )}
              {fileCategoryOptions.length > 0 && (
                <optgroup label="File categories">
                  {fileCategoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.description}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </FormField>
          <FormField id="files" label="Select files to upload" required>
            <input id="files" type="file" multiple onChange={handleFileChange}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg p-2" />
          </FormField>
          {pendingFiles.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-400">Selected Files:</p>
              <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                {pendingFiles.map((f, i) => (
                  <li key={i} className="truncate">{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                ))}
              </ul>
            </div>
          )}
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload Files"}</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* File Viewer */}
      {viewerOpen && (
        <FileViewer
          open={viewerOpen}
          onClose={() => { setViewerOpen(false); setViewerUrl(null); setViewerName(null); }}
          fileUrl={viewerUrl}
          fileName={viewerName}
        />
      )}

      {/* Edit File Drawer */}
      <Drawer
        open={!!editingFile}
        onClose={() => setEditingFile(null)}
        title="Edit Document"
        description="Update the document's name, category, or replace the file."
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditingFile(null)} disabled={updatingFile}>
              Cancel
            </Button>
            <Button type="submit" form="edit-file-form" disabled={updatingFile}>
              {updatingFile ? "Saving..." : "Save Changes"}
            </Button>
          </>
        }
      >
        {editingFile && (
          <form
            id="edit-file-form"
            onSubmit={(e) => { e.preventDefault(); handleEditSave(); }}
            className="space-y-6"
          >
            {editError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                {editError}
              </div>
            )}

            {/* File Name */}
            <FormField id="edit-fileName" label="File Name" required>
              <Input
                id="edit-fileName"
                value={editingFile.fileName}
                onChange={(e) => setEditingFile((p) => p ? { ...p, fileName: e.target.value } : p)}
                placeholder="Document name"
              />
            </FormField>

            {/* Category */}
            <FormField id="edit-category" label="Document Category">
              <Select
                id="edit-category"
                value={editingFile.categoryId}
                onChange={(e) => setEditingFile((p) => p ? { ...p, categoryId: e.target.value } : p)}
              >
                <option value="">No category</option>
                {documentTypes.length > 0 && (
                  <optgroup label="Required types">
                    {documentTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.description}</option>
                    ))}
                  </optgroup>
                )}
                {fileCategoryOptions.length > 0 && (
                  <optgroup label="File categories">
                    {fileCategoryOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.description}</option>
                    ))}
                  </optgroup>
                )}
              </Select>
            </FormField>

            {/* Replace File */}
            <FormField id="edit-file" label="Replace File (optional)">
              <div
                onClick={() => editFileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors"
              >
                <input
                  ref={editFileInputRef}
                  id="edit-file"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setEditingFile((p) => p ? { ...p, newFile: f, fileName: f ? f.name : p.fileName } : p);
                  }}
                />
                {editingFile.newFile ? (
                  <div className="flex items-center gap-3 w-full">
                    <FileText className="h-8 w-8 text-blue-500 shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{editingFile.newFile.name}</p>
                      <p className="text-xs text-zinc-400">{(editingFile.newFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditingFile((p) => p ? { ...p, newFile: null } : p); }}
                      className="ml-auto text-zinc-400 hover:text-red-500 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-zinc-400 mb-2" />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Click to select a replacement file</p>
                    <p className="text-xs text-zinc-400 mt-1">Leave empty to keep the existing file</p>
                  </>
                )}
              </div>
            </FormField>
          </form>
        )}
      </Drawer>
    </>
  );
}
