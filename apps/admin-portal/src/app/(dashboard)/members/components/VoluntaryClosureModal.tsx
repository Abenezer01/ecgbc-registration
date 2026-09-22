"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Archive,
  Calendar,
  FileText,
  User,
  Phone,
  Mail,
  Loader2,
  Info
} from "lucide-react";
import { Modal, ModalFooter, Button, FormField, Input, Select } from "@/components/ui";
import { useSubmitClosureRequest } from "@/hooks/useClosureRequests";
import { toast } from "react-hot-toast";
import { ChurchSearchPicker, MemberOption } from "./ChurchSearchPicker";

interface VoluntaryClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: {
    id: string;
    name: string;
    certificateNo: string;
  } | null;
  onSuccess?: () => void;
}

export function VoluntaryClosureModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: VoluntaryClosureModalProps) {
  const { mutateAsync: submitClosure, isPending: submitting } = useSubmitClosureRequest();

  const [currentMember, setCurrentMember] = useState<MemberOption | null>(null);
  const [closureType, setClosureType] = useState<
    "DISSOLUTION" | "LOW_MEMBERSHIP" | "FINANCIAL_HARDSHIP" | "LEADERSHIP_VACANCY" | "EXTERNAL_AMALGAMATION" | "OTHER"
  >("DISSOLUTION");
  const [resolutionDate, setResolutionDate] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reason, setReason] = useState("");
  const [recordsLocation, setRecordsLocation] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactPersonPhone, setContactPersonPhone] = useState("");
  const [contactPersonEmail, setContactPersonEmail] = useState("");
  const [resolutionDocumentUrl, setResolutionDocumentUrl] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (member) {
        setCurrentMember({
          id: member.id,
          name: member.name,
          certificateNo: member.certificateNo,
          isActive: true,
        });
      } else {
        setCurrentMember(null);
      }
      setClosureType("DISSOLUTION");
      setResolutionDate("");
      setEffectiveDate(new Date().toISOString().split("T")[0]);
      setReason("");
      setRecordsLocation("");
      setContactPersonName("");
      setContactPersonPhone("");
      setContactPersonEmail("");
      setResolutionDocumentUrl("");
    }
  }, [isOpen, member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentMember) {
      toast.error("Please select a church to initiate closure");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason or statement for voluntary closure");
      return;
    }

    try {
      await submitClosure({
        memberId: currentMember.id,
        closureType,
        reason: reason.trim(),
        resolutionDate: resolutionDate || undefined,
        effectiveDate: effectiveDate || new Date().toISOString(),
        recordsLocation: recordsLocation.trim() || undefined,
        contactPersonName: contactPersonName.trim() || undefined,
        contactPersonPhone: contactPersonPhone.trim() || undefined,
        contactPersonEmail: contactPersonEmail.trim() || undefined,
        resolutionDocumentUrl: resolutionDocumentUrl.trim() || undefined,
      });

      toast.success("Voluntary closure request submitted successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit closure request");
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Initiate Voluntary Closure Request" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Church Search Picker */}
        <ChurchSearchPicker
          selectedChurch={currentMember}
          onSelectChurch={setCurrentMember}
          disabled={!!member}
          label="Church to Close / Deactivate *"
          placeholder="Search church to voluntarily deactivate..."
          required
        />

        {/* Zero Loss Banner */}
        {currentMember && (
          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
            <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                Voluntary Closure for: {currentMember.name} ({currentMember.certificateNo})
              </p>
              <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
                This request initiates a formal closure workflow. Upon administrative approval, active operations cease, but all historical certificates, annual reports, CRVs, financial transactions, and files remain permanently preserved with zero data loss.
              </p>
            </div>
          </div>
        )}

        {/* Basic Closure Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="closureType" label="Closure Reason Type *" required>
              <Select
                value={closureType}
                onChange={(e) => setClosureType(e.target.value as any)}
              >
                <option value="DISSOLUTION">Congregation Dissolution / Ceased Operations</option>
                <option value="LOW_MEMBERSHIP">Disbandment due to Low Membership</option>
                <option value="FINANCIAL_HARDSHIP">Financial Hardship / Inviability</option>
                <option value="LEADERSHIP_VACANCY">Leadership Vacancy / Transition</option>
                <option value="EXTERNAL_AMALGAMATION">External Amalgamation</option>
                <option value="OTHER">Other Reason</option>
              </Select>
            </FormField>

            <FormField id="effectiveDate" label="Requested Effective Date *" required>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="resolutionDate" label="Board / General Assembly Resolution Date">
              <Input
                type="date"
                value={resolutionDate}
                onChange={(e) => setResolutionDate(e.target.value)}
              />
            </FormField>

            <FormField id="resolutionDocumentUrl" label="Resolution Minutes Document URL / Ref">
              <Input
                type="text"
                placeholder="e.g. Document link or Synod minute code"
                value={resolutionDocumentUrl}
                onChange={(e) => setResolutionDocumentUrl(e.target.value)}
              />
            </FormField>
          </div>

          <FormField id="reason" label="Detailed Closure Rationale & Minutes Summary *" required>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail the circumstances, congregation decision, and pastoral leadership rationale for this voluntary closure..."
              className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </FormField>

          {/* Archival Records & Property Custody */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Archive size={14} className="text-amber-600" />
              Archival Records & Custody Details
            </h4>

            <FormField id="recordsLocation" label="Archives & Property Disposition Custody">
              <Input
                type="text"
                placeholder="e.g. Church register & files deposited at Regional Synod HQ"
                value={recordsLocation}
                onChange={(e) => setRecordsLocation(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField id="contactPersonName" label="Archival Custodian Name">
                <Input
                  type="text"
                  placeholder="Full name"
                  value={contactPersonName}
                  onChange={(e) => setContactPersonName(e.target.value)}
                />
              </FormField>

              <FormField id="contactPersonPhone" label="Custodian Phone">
                <Input
                  type="text"
                  placeholder="+251..."
                  value={contactPersonPhone}
                  onChange={(e) => setContactPersonPhone(e.target.value)}
                />
              </FormField>

              <FormField id="contactPersonEmail" label="Custodian Email">
                <Input
                  type="email"
                  placeholder="contact@..."
                  value={contactPersonEmail}
                  onChange={(e) => setContactPersonEmail(e.target.value)}
                />
              </FormField>
            </div>
          </div>
        </div>

        <ModalFooter className="mt-4 flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !currentMember || !reason.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Submitting Request...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Submit Closure Request
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
