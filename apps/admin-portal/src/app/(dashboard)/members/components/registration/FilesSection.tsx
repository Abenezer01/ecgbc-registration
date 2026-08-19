import React from "react";
import { UploadCloud, FileText, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Select } from "@/components/ui";
import { DataLookup } from "./types";
import { ACCEPTED_TYPES, MAX_FILES, MAX_PER_FILE_SIZE_MB, MAX_TOTAL_SIZE_MB } from "@/lib/validation/member-registration.schema";

interface FilesSectionProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  fileCategories: Record<number, string>;
  setFileCategories: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  fileErrors: string[];
  setFileErrors: React.Dispatch<React.SetStateAction<string[]>>;
  perFileErrors: Record<number, string>;
  setPerFileErrors: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  fileCategoryOptions: DataLookup[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCategoryChange: (idx: number, catId: string) => void;
  handleRemoveFile: (idx: number) => void;
}

export function FilesSection({
  files,
  setFiles,
  fileCategories,
  setFileCategories,
  fileErrors,
  setFileErrors,
  perFileErrors,
  setPerFileErrors,
  fileCategoryOptions,
  handleFileChange,
  handleCategoryChange,
  handleRemoveFile,
}: FilesSectionProps) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
        ተያያዥ ፋይሎች (Member Files)
      </h4>

      {/* Required docs checklist */}
      {fileCategoryOptions.filter((c) => c.isRequired).length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Required Documents:</p>
          <ul className="text-xs space-y-1">
            {fileCategoryOptions.filter((c) => c.isRequired).map((c) => {
              const isUploaded = Object.values(fileCategories).includes(c.id);
              return (
                <li key={c.id} className="flex items-center gap-2">
                  {isUploaded ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-zinc-300 shrink-0" />
                  )}
                  <span className={isUploaded ? "line-through text-zinc-400" : "text-blue-700 dark:text-blue-400"}>
                    {c.description}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* File-level errors */}
      {fileErrors.length > 0 && (
        <div className="space-y-1">
          {fileErrors.map((fe, i) => (
            <div key={i} className="p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {fe}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-white dark:bg-zinc-950 hover:bg-zinc-50/50 transition-colors relative">
        <input type="file" multiple accept={ACCEPTED_TYPES} onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
        <UploadCloud className="h-10 w-10 text-zinc-400 mb-3" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Click or drag & drop files here</p>
        <p className="text-xs text-zinc-500 mt-1">
          PDF, DOCX, XLSX, PNG, JPG · Max {MAX_FILES} files · {MAX_PER_FILE_SIZE_MB}MB per file · {MAX_TOTAL_SIZE_MB}MB total
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-500">
            <span>Selected Files ({files.length}/{MAX_FILES})</span>
            <button type="button" onClick={() => { setFiles([]); setFileCategories({}); setFileErrors([]); setPerFileErrors({}); }} className="hover:text-red-500">Clear All</button>
          </div>
          <div className="space-y-2">
            {files.map((file, idx) => (
              <div key={idx} className={`rounded-lg border text-sm ${perFileErrors[idx] ? "border-red-300 bg-red-50 dark:bg-red-950/20" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"}`}>
                <div className="flex items-center gap-3 p-2.5">
                  <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-zinc-950 dark:text-white">{file.name}</p>
                    <p className="text-xs text-zinc-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  {fileCategoryOptions.length > 0 && (
                    <Select
                      id={`file-cat-${idx}`}
                      value={fileCategories[idx] || ""}
                      onChange={(e) => handleCategoryChange(idx, e.target.value)}
                      className="w-44 text-xs"
                    >
                      <option value="">Select Category...</option>
                      {fileCategoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>{c.description}{c.isRequired ? " (Required)" : ""}</option>
                      ))}
                    </Select>
                  )}
                  <button type="button" onClick={() => handleRemoveFile(idx)} className="text-zinc-400 hover:text-red-500 p-0.5 shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {perFileErrors[idx] && (
                  <p className="px-3 pb-2 text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {perFileErrors[idx]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
