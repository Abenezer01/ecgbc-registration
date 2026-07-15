"use client";

import React, { useState } from "react";
import { FolderOpen, CloudLightning, FileText, Download, Trash2, Eye, Plus, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button, Modal, ModalFooter, FormField } from "@/components/ui";
import { useMemberFiles, useUploadMemberFiles, useDeleteMemberFile } from "@/hooks/useMemberFiles";
import { useAuth } from "@/hooks/useAuth";
import { fileUrl } from "@/lib/file-url";
import { FileViewer } from "@/components/shared/FileViewer";
import { useRequiredDocumentTypes, useDocumentCompleteness } from "@/hooks/useDocumentCompleteness";

interface DocumentsTabProps {
  member: any;
}

export function DocumentsTab({ member }: DocumentsTabProps) {
  const { hasPermission } = useAuth();
  const memberId = member.id;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFileTypeId, setSelectedFileTypeId] = useState<string>("");

  // File Viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState<string | null>(null);

  // Queries & Mutations
  const { data: files = [], isLoading, refetch } = useMemberFiles({ memberId, isFromSelamMinster: false });
  const { data: documentTypes = [] } = useRequiredDocumentTypes();
  const { data: documentCompleteness } = useDocumentCompleteness(memberId);
  const { mutateAsync: uploadFiles, isPending: uploading } = useUploadMemberFiles();
  const { mutateAsync: deleteFile, isPending: deleting } = useDeleteMemberFile();

  const canAdd = hasPermission("add_file") || hasPermission("member_change");
  const canDelete = hasPermission("delete_file") || hasPermission("member_change");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPendingFiles(Array.from(e.target.files));
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingFiles.length === 0) {
      setUploadError("Please select at least one file to upload.");
      return;
    }
    if (!selectedFileTypeId) {
      setUploadError("Please select a document type.");
      return;
    }
    try {
      await uploadFiles({ 
        memberId, 
        files: pendingFiles,
        fileTypeId: selectedFileTypeId,
      });
      setUploadOpen(false);
      setPendingFiles([]);
      setSelectedFileTypeId("");
      refetch();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || "Failed to upload files.");
    }
  };

  const handleDelete = async (fileId: string) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        await deleteFile({ fileId, memberId });
        refetch();
      } catch {}
    }
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
    const fullUrl = fileUrl("file", relativeUrl);
    setViewerUrl(fullUrl);
    setViewerName(name);
    setViewerOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
     

      {/* Required Documents Checklist */}
      {documentCompleteness && documentTypes.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Required Documents</h3>
            <span className="text-xs text-zinc-500">
              {documentCompleteness.uploadedCount} of {documentCompleteness.totalRequired} completed
            </span>
          </div>
          
          <div className="space-y-2">
            {documentTypes.map((docType) => {
              const isUploaded = documentCompleteness.uploadedDocuments.some(
                (doc) => doc.fileType?.id === docType.id
              );
              const isRequired = !!docType.documentRequirement?.isRequired;
              return (
                <div
                  key={docType.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  {isUploaded ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : isRequired ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  ) : (
                    <FileText className="h-5 w-5 text-zinc-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {docType.description}
                    </p>
                    {(docType.documentRequirement?.note || docType.note) && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {docType.documentRequirement?.note || docType.note}
                      </p>
                    )}
                  </div>
                  {isUploaded ? (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Uploaded
                    </span>
                  ) : (
                    <span className={isRequired ? "text-xs text-amber-600 dark:text-amber-400 font-medium" : "text-xs text-zinc-400 font-medium"}>
                      {isRequired ? "Required" : "Optional"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Local Files Grid */}
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
            {files.map((file, idx) => (
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
                  {(file as any).fileType && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                      {(file as any).fileType.description}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => triggerViewer(file.file, file.fileName)}
                    className="p-1 text-zinc-400 hover:text-blue-600 rounded transition-colors"
                    title="View file"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDownload(file.fileName, file.file)}
                    className="p-1 text-zinc-400 hover:text-blue-600 rounded transition-colors"
                    title="Download file"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {canDelete && (
                    <button 
                      onClick={() => handleDelete(file.id)}
                      className="p-1 text-zinc-400 hover:text-red-500 rounded transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 text-sm">No files have been attached to this member yet.</p>
          </div>
        )}
      </div>

      {/* Upload File Modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Member Files" size="md">
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {uploadError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {uploadError}
            </div>
          )}
          
          <FormField id="fileType" label="Document Type" required>
            <select
              id="fileType"
              value={selectedFileTypeId}
              onChange={(e) => setSelectedFileTypeId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select document type...</option>
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.description}
                </option>
              ))}
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

      {/* Reusable File Viewer modal */}
      {viewerOpen && (
        <FileViewer
          open={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setViewerUrl(null);
            setViewerName(null);
          }}
          fileUrl={viewerUrl}
          fileName={viewerName}
        />
      )}
    </div>
  );
}
