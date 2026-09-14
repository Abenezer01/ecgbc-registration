"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalFooter, Button, FormField, Input, Select } from "@/components/ui";
import { FileText, Eye, CheckCircle2, RefreshCw, Download, FileCheck, Building2, Landmark } from "lucide-react";
import { usePreviewCertificateLetter, useGenerateCertificateLetter, CertificateLetterParams } from "@/hooks/useMembers";

interface GenerateLetterModalProps {
  open: boolean;
  onClose: () => void;
  member: any;
  onSuccess?: () => void;
}

export function GenerateLetterModal({ open, onClose, member, onSuccess }: GenerateLetterModalProps) {
  const [churchType, setChurchType] = useState<"new" | "existing">("new");
  const [refNo, setRefNo] = useState("");
  const [applicationDate, setApplicationDate] = useState("");
  const [bylawPageCount, setBylawPageCount] = useState<number | string>(21);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [ccPeaceSecurity, setCcPeaceSecurity] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { mutateAsync: previewLetter, isPending: loadingPreview } = usePreviewCertificateLetter();
  const { mutateAsync: generateLetter, isPending: generatingLetter } = useGenerateCertificateLetter();

  // Initialize fields when member opens
  useEffect(() => {
    if (open && member) {
      // Default to "new" or detect from member category/type if available
      const isNebar = member.name?.toLowerCase().includes("nebar") ||
                      member.type?.value?.toLowerCase().includes("nebar");
      setChurchType(isNebar ? "existing" : "new");

      const certNo = member.certificateNo || "0000";
      setRefNo(`ኢወአክካ/ደብ/${certNo}/18`);
      setRecipientAddress(member.city ? `${member.city}፤` : "አዲስ አበባ፤");
      setBylawPageCount(21);
      
      const regionDesc = member.region?.description;
      setCcPeaceSecurity(regionDesc ? `ለ${regionDesc} ሰላምና ጸጥታ ቢሮ` : "ለአዲስ አበባ ከተማ አስተዳደር ሰላምና ጸጥታ ቢሮ");
      
      // Clear previous preview
      setPreviewUrl(null);
      setErrorMsg(null);
    }
  }, [open, member]);

  // Load preview whenever modal opens or churchType changes
  const fetchPreview = async (typeToUse = churchType) => {
    if (!member) return;
    try {
      setErrorMsg(null);
      const params: CertificateLetterParams = {
        churchType: typeToUse,
        refNo: refNo || undefined,
        applicationDate: applicationDate || undefined,
        bylawPageCount: bylawPageCount ? Number(bylawPageCount) : 21,
        recipientAddress: recipientAddress || undefined,
        ccPeaceSecurity: ccPeaceSecurity || undefined,
      };

      const url = await previewLetter({
        memberId: member.id,
        params,
      });
      setPreviewUrl(url);
    } catch (err: any) {
      console.error("Preview error:", err);
      setErrorMsg(err.response?.data?.message || "Failed to load letter preview.");
    }
  };

  useEffect(() => {
    if (open && member) {
      fetchPreview(churchType);
    }
  }, [open, member?.id, churchType]);

  const handleSave = async () => {
    if (!member) return;
    try {
      setErrorMsg(null);
      const params: CertificateLetterParams = {
        churchType,
        refNo: refNo || undefined,
        applicationDate: applicationDate || undefined,
        bylawPageCount: bylawPageCount ? Number(bylawPageCount) : 21,
        recipientAddress: recipientAddress || undefined,
        ccPeaceSecurity: ccPeaceSecurity || undefined,
      };

      await generateLetter({
        memberId: member.id,
        params,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Generate error:", err);
      setErrorMsg(err.response?.data?.message || "Failed to generate and save letter.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate Letter of Certification (የምስክር ወረቀት ደብዳቤ)"
      description="Create a formal letter of certification confirming church registration on official ECGBC letterhead."
      size="full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left Form: 5 cols */}
        <div className="lg:col-span-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-900/30">
              {errorMsg}
            </div>
          )}

          {/* Template Selection Cards */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-2">
              Select Letter Template / ዓይነት
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => { setChurchType("new"); fetchPreview("new"); }}
                className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-start gap-1 transition-all ${
                  churchType === "new"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2 w-full justify-between">
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    አዲስ ቸርች
                  </span>
                  {churchType === "new" && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  የምዝገባ ሰርተፍኬት እና የተረጋገጠ መተዳደሪያ ደንብ አባሪ የሚገልጽ ደብዳቤ (New Church)
                </p>
              </div>

              <div
                onClick={() => { setChurchType("existing"); fetchPreview("existing"); }}
                className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-start gap-1 transition-all ${
                  churchType === "existing"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2 w-full justify-between">
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Landmark className="h-4 w-4 text-blue-600" />
                    ነባር ቸርች
                  </span>
                  {churchType === "existing" && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  የመሥራች አባልነት መስፈርት እና ሰርተፍኬት ስለመስጠት (Existing Church)
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 bg-zinc-50/80 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
            <FormField id="refNo" label="Reference Number (የደብዳቤ ቁጥር)">
              <Input
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="e.g. ኢወአክካ/ደብ/02344/18"
                className="h-9 text-sm"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField id="appDate" label="Application Date (የጠየቁበት ቀን)">
                <Input
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  placeholder="e.g. 5/9/2018 ዓ.ም"
                  className="h-9 text-sm"
                />
              </FormField>

              {churchType === "new" ? (
                <FormField id="bylawPages" label="Bylaw Pages (የደንብ ገጽ)">
                  <Input
                    type="number"
                    value={bylawPageCount}
                    onChange={(e) => setBylawPageCount(e.target.value)}
                    placeholder="21"
                    className="h-9 text-sm"
                  />
                </FormField>
              ) : (
                <FormField id="city" label="City / Address (ከተማ)">
                  <Input
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="አዲስ አበባ፤"
                    className="h-9 text-sm"
                  />
                </FormField>
              )}
            </div>

            {churchType === "new" && (
              <FormField id="cityNew" label="City / Address (ከተማ)">
                <Input
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="አዲስ አበባ፤"
                  className="h-9 text-sm"
                />
              </FormField>
            )}

            <FormField id="ccPeace" label="CC: Peace & Security Bureau (ግልባጭ)">
              <Input
                value={ccPeaceSecurity}
                onChange={(e) => setCcPeaceSecurity(e.target.value)}
                placeholder="ለአዲስ አበባ ከተማ አስተዳደር ሰላምና ጸጥታ ቢሮ"
                className="h-9 text-sm"
              />
            </FormField>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchPreview(churchType)}
              loading={loadingPreview}
              className="w-full gap-2 mt-2"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Preview
            </Button>
          </div>
        </div>

        {/* Right Preview: 7 cols */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Eye className="h-4 w-4" /> Live PDF Preview (A4 Portrait)
            </span>
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" /> Open in New Tab
              </a>
            )}
          </div>

          <div className="w-full h-[65vh] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
            {loadingPreview ? (
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-sm">Rendering letter preview...</span>
              </div>
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="Letter of Certification Preview"
              />
            ) : (
              <div className="text-sm text-zinc-400">Preview not loaded. Click Refresh Preview.</div>
            )}
          </div>
        </div>
      </div>

      <ModalFooter className="mt-6 flex justify-between items-center">
        <Button variant="ghost" onClick={onClose} disabled={generatingLetter}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            loading={generatingLetter}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FileCheck className="h-4 w-4" /> Save & Attach to Documents
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
