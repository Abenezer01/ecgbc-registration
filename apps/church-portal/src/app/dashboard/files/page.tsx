"use client";

import React, { useState } from "react";
import { FolderOpen, Download, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui";
import { usePortalFiles } from "@/hooks/usePortalFiles";
import { fileUrl } from "@/lib/file-url";
import { FileViewer } from "@/components/shared/FileViewer";

export default function FilesPage() {
  const { data: files = [], isLoading } = usePortalFiles();

  // File Viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState<string | null>(null);

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
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-2xl font-bold text-neutral-900">Church Documents</h4>
          <p className="text-sm text-neutral-500">View your registration certificate and compliance documents.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-neutral-500 animate-pulse">Loading files...</div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-dashed border-neutral-200">
          <div className="bg-emerald-50 p-4 rounded-full mb-4">
            <FolderOpen className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No Documents</h3>
          <p className="text-sm text-neutral-500 max-w-sm">
            There are no documents uploaded for your church yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="group bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-all hover:border-neutral-300"
            >
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-lg shrink-0 text-blue-600">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-neutral-900 truncate mb-1">
                    {file.fileName || file.fileType?.value || "Document"}
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Uploaded on {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triggerViewer(file.file, file.fileName)}
                      className="h-8 text-xs flex-1 gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file.fileName, file.file)}
                      className="h-8 text-xs flex-1 gap-1"
                    >
                      <Download className="h-3.5 w-3.5" /> Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FileViewer 
        open={viewerOpen} 
        onClose={() => setViewerOpen(false)} 
        fileUrl={viewerUrl} 
        fileName={viewerName} 
      />
    </div>
  );
}
