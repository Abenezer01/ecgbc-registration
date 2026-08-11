"use client";

import React, { useState } from "react";
import { FolderOpen, FileText, Download, Eye, Plus, CheckCircle2, AlertTriangle, Pencil, Check, X } from "lucide-react";
import { Button, Modal, ModalFooter, FormField, Input, Select, RowActions, presets } from "@/components/ui";
import { useMemberFiles, useUploadMemberFiles, useDeleteMemberFile, useUpdateMemberFile } from "@/hooks/useMemberFiles";
import { useAuth } from "@/hooks/useAuth";
import { useDataLookups } from "@/hooks/useDataLookups";
import { fileUrl } from "@/lib/file-url";
import { FileViewer } from "@/components/shared/FileViewer";
import { useRequiredDocumentTypes } from "@/hooks/useDocumentCompleteness";

interface DocumentsTabProps {
  member: any;
}

interface EditingFile {
  id: string;
  fileName: string;
  categoryId: string;
}

export function DocumentsTab({ member }: DocumentsTabProps) {
  const { hasPermission } = useAuth();
  const memberId = member.id;

  // ── upload state ────────────────────────────────────────────────────────────
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFileTypeId, setSelectedFileTypeId] = useState<string>("");

  // ── inline edit state ───────────────────────────────────────────────────────
  const [editingFile, setEditingFile] = useState<EditingFile | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // ── file viewer state ───────────────────────────────────────────────────────
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState<string | null>(null);

  // ── queries & mutations ─────────────────────────────────────────────────────
  const { data: files = [], isLoading, refetch } = useMemberFiles({ memberId, isFromSelamMinster: false });
  const { data: documentTypes = [] } = useRequiredDocumentTypes();
  const { mutateAsync: uploadFiles, isPending: uploading } = useUploadMemberFiles();
  const { mutateAsync: updateFile, isPending: updatingFile } = useUpdateMemberFile();
  const { mutateAsync: deleteFile } = useDeleteMemberFile();
  const { data: lookups = [] } = useDataLookups();

  const fileCategoryOptions = lookups.filter((l) => l.category === "FILE_TYPE" || l.type === "Document Type");

  const canAdd    = hasPermission("add_file")    || hasPermission("member_change");
  const canEdit   = hasPermission("add_file")    || hasPermission("member_change");
  const canDelete = hasPermission("delete_file") || hasPermission("member_change");

  // ── upload handlers ─────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) { setPendingFiles(Array.from(e.target.files)); setUploadError(null); }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingFiles.length === 0) { setUploadError("Please select at least one file."); return; }
    if (!selectedFileTypeId) { setUploadError("Please select a document type."); return; }
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

  // ── edit handlers ───────────────────────────────────────────────────────────
  const openEdit = (file: any) => {
    setEditingFile({
      id: file.id,
      fileName: file.fileName || "",
      categoryId: file.categoryId || file.category?.id || "",
    });
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editingFile) return;
    if (!editingFile.fileName.trim()) { setEditError("File name is required."); return; }
    try {
      await updateFile({
        fileId: editingFile.id,
        memberId,
        fileName: editingFile.fileName.trim(),
        categoryId: editingFile.categoryId || null,
      });
      setEditingFile(null);
    } catch (err: any) {
      setEditError(err.response?.data?.message || "Failed to update file.");
    }
  };

  // ── delete handler ──────────────────────────────────────────────────────────
  const handleDelete = async (fileId: string) => {
    if (!window.confirm("Delete this file?")) return;
    try { await deleteFile({ fileId, memberId }); refetch(); } catch {}
  };

  // ── viewer handler ──────────────────────────────────────────────────────────
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

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Required Documents Checklist */}
      {documentTypes.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Document Checklist</h3>
            <span className="text-xs text-zinc-500">
              {files.filter(f => documentTypes.some(dt => dt.id === (f as any).fileType?.id || dt.value === f.category?.value)).length} of {documentTypes.filter(dt => dt.isRequired || dt.documentRequirement?.isRequired).length} required uploaded
            </span>
          </div>
          <div className="space-y-2">
            {documentTypes.map((docType) => {
              const isUploaded = files.some(
                (f) => (f as any).fileType?.id === docType.id || f.category?.value === docType.value
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
                  <span className={isUploaded
                    ? "text-xs text-green-600 dark:text-green-400 font-medium"
                    : isRequired
                      ? "text-xs text-amber-600 dark:text-amber-400 font-medium"
                      : "text-xs text-zinc-400 font-medium"
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
        <div className="flex items-center justify-between gap-4 mb-4">
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
              const isEditing = editingFile?.id === file.id;
              const categoryLabel = file.category?.description || (file as any).fileType?.description;

              return isEditing ? (
                /* ── Inline edit card ─────────────────────────────────────── */
                <div key={file.id} className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-700 rounded-xl p-4 space-y-3">
                  {editError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{editError}</p>
                  )}
                  <div>
                    <label className="text-[11px] font-medium text-zinc-500 mb-1 block">File Name</label>
                    <Input
                      value={editingFile.fileName}
                      onChange={(e) => setEditingFile((p) => p ? { ...p, fileName: e.target.value } : p)}
                      className="h-8 text-sm"
                      placeholder="Document name"
                    />
                  </div>
                  {fileCategoryOptions.length > 0 && (
                    <div>
                      <label className="text-[11px] font-medium text-zinc-500 mb-1 block">Category</label>
                      <Select
                        value={editingFile.categoryId}
                        onChange={(e) => setEditingFile((p) => p ? { ...p, categoryId: e.target.value } : p)}
                        className="h-8 text-sm"
                      >
                        <option value="">No category</option>
                        {fileCategoryOptions.map((c) => (
                          <option key={c.id} value={c.id}>{c.description}</option>
                        ))}
                      </Select>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditingFile(null)} className="h-7 px-3 text-xs" disabled={updatingFile}>
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={handleEditSave} className="h-7 px-3 text-xs" disabled={updatingFile}>
                      <Check className="h-3.5 w-3.5 mr-1" /> {updatingFile ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── Display card ─────────────────────────────────────────── */
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
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                        {categoryLabel}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <RowActions
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    actions={[
                      presets.view({ onClick: () => triggerViewer(file.file, file.fileName), allowed: true }),
                      presets.download({ onClick: () => handleDownload(file.fileName, file.file), allowed: true }),
                      presets.edit({ onClick: () => openEdit(file), allowed: canEdit }),
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
            <input
              id="files"
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg p-2"
            />
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
    </div>
  );
}
