"use client";

import React from "react";
import { Modal, Button } from "@/components/ui";
import { X, ExternalLink, Download } from "lucide-react";

interface FileViewerProps {
  open: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName?: string | null;
}

export function FileViewer({ open, onClose, fileUrl, fileName }: FileViewerProps) {
  const getFileType = (name?: string) => {
    if (!name) return "unknown";
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "image";
    return "unknown";
  };

  const fileType = getFileType(fileName || "");

  const handleDownload = () => {
    if (!fileUrl) return;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    if (!fileUrl) return <div className="text-zinc-500">Unable to preview file.</div>;

    if (fileType === "pdf") {
      return (
        <iframe
          title={fileName || "pdf-viewer"}
          src={fileUrl}
          className="w-full h-[70vh] border-0 rounded-lg"
        />
      );
    }

    if (fileType === "image") {
      return (
        <img
          src={fileUrl}
          alt={fileName || "file"}
          className="max-w-full max-h-[70vh] object-contain rounded-lg border border-zinc-200 dark:border-zinc-800"
        />
      );
    }

    return (
      <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <p className="text-zinc-500 dark:text-zinc-400 mb-4">Preview not available for this file type.</p>
        <Button onClick={handleDownload} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Download file
        </Button>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={fileName || "File Viewer"}
      size="xl"
    >
      <div className="flex justify-between items-center gap-3 mb-4 absolute right-12 top-4">
        {fileUrl && (
          <Button
            onClick={() => window.open(fileUrl, "_blank")}
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
          >
            <ExternalLink className="h-3 w-3" /> Open In New Tab
          </Button>
        )}
      </div>

      <div className="min-h-[200px] flex justify-center items-center p-2 bg-zinc-100/40 dark:bg-zinc-950/40 rounded-xl">
        {renderContent()}
      </div>
    </Modal>
  );
}
