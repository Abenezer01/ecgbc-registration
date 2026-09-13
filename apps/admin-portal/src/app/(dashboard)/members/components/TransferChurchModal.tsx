"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  Building2,
  MapPin,
  AlertTriangle,
  Calendar,
  FileText,
  Loader2,
  CheckCircle2,
  Info
} from "lucide-react";
import { Modal, ModalFooter, Button, FormField, Input, Select } from "@/components/ui";
import { useFellowships } from "@/hooks/useFellowships";
import { useDataLookups } from "@/hooks/useDataLookups";
import { useTransferMember } from "@/hooks/useMemberTransfers";
import { toast } from "react-hot-toast";

interface TransferChurchModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    name: string;
    nameEn?: string;
    certificateNo: string;
    councilFellowshipId: string;
    regionId?: string;
    councilFellowship?: { id: string; name: string };
    region?: { id: string; description: string; value: string };
    city?: string;
    subcity?: string;
    zone?: string;
    district?: string;
    houseNumber?: string;
  };
  onSuccess?: () => void;
}

export function TransferChurchModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: TransferChurchModalProps) {
  const { data: fellowshipsData, isLoading: fellowshipsLoading } = useFellowships({ limit: 100 });
  const { data: lookups = [] } = useDataLookups();
  const { mutateAsync: transferMember, isPending: submitting } = useTransferMember();

  const regionOptions = lookups.filter((l) => l.type === "region");
  const fellowships = fellowshipsData?.fellowships || [];

  const [toFellowshipId, setToFellowshipId] = useState("");
  const [toRegionId, setToRegionId] = useState("");
  const [transferType, setTransferType] = useState<"REDISTRICTING" | "RELOCATION" | "ADMINISTRATIVE" | "OTHER">("REDISTRICTING");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [reason, setReason] = useState("");
  const [updateAddress, setUpdateAddress] = useState(false);

  // Address fields
  const [toCity, setToCity] = useState("");
  const [toSubcity, setToSubcity] = useState("");
  const [toZone, setToZone] = useState("");
  const [toDistrict, setToDistrict] = useState("");
  const [toHouseNumber, setToHouseNumber] = useState("");

  useEffect(() => {
    if (isOpen && member) {
      setToFellowshipId("");
      setToRegionId(member.regionId || "");
      setTransferType("REDISTRICTING");
      setEffectiveDate(new Date().toISOString().split("T")[0]);
      setReferenceNumber("");
      setReason("");
      setUpdateAddress(false);
      setToCity(member.city || "");
      setToSubcity(member.subcity || "");
      setToZone(member.zone || "");
      setToDistrict(member.district || "");
      setToHouseNumber(member.houseNumber || "");
    }
  }, [isOpen, member]);

  // When transferType is RELOCATION, automatically enable address editing
  const handleTypeChange = (type: "REDISTRICTING" | "RELOCATION" | "ADMINISTRATIVE" | "OTHER") => {
    setTransferType(type);
    if (type === "RELOCATION") {
      setUpdateAddress(true);
    }
  };

  // When destination fellowship changes, prefill its region if available
  const handleFellowshipChange = (fId: string) => {
    setToFellowshipId(fId);
    const selectedF = fellowships.find((f) => f.id === fId);
    if (selectedF?.regionId) {
      setToRegionId(selectedF.regionId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!toFellowshipId) {
      toast.error("Please select a destination fellowship");
      return;
    }

    if (toFellowshipId === member.councilFellowshipId && (!toRegionId || toRegionId === member.regionId) && !updateAddress) {
      toast.error("Destination fellowship is the same as the current fellowship. Please select a different fellowship or update region/location.");
      return;
    }

    try {
      await transferMember({
        memberId: member.id,
        toFellowshipId,
        toRegionId: toRegionId || undefined,
        transferType,
        effectiveDate: effectiveDate || new Date().toISOString(),
        referenceNumber: referenceNumber.trim() || undefined,
        reason: reason.trim() || undefined,
        ...(updateAddress ? {
          toCity: toCity.trim() || undefined,
          toSubcity: toSubcity.trim() || undefined,
          toZone: toZone.trim() || undefined,
          toDistrict: toDistrict.trim() || undefined,
          toHouseNumber: toHouseNumber.trim() || undefined,
        } : {}),
      });

      toast.success("Church successfully transferred to new fellowship");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to transfer church");
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Transfer Church Between Fellowships" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Zero-Loss Info Banner */}
        <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/20 flex items-start gap-3 text-xs text-teal-800 dark:text-teal-300">
          <Info className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              Transferring: {member.name} ({member.certificateNo})
            </p>
            <p className="text-teal-700 dark:text-teal-400 leading-relaxed">
              Moving this church to a different fellowship preserves its full organizational history.
              Existing reports, financial receipts, files, and church users remain intact.
            </p>
          </div>
        </div>

        {/* Current State Summary Card */}
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-zinc-500 font-medium">Current Fellowship:</span>
            <p className="font-semibold text-zinc-900 dark:text-white mt-0.5">
              {member.councilFellowship?.name || "Not Assigned"}
            </p>
          </div>
          <div>
            <span className="text-zinc-500 font-medium">Current Region:</span>
            <p className="font-semibold text-zinc-900 dark:text-white mt-0.5">
              {member.region?.description || member.region?.value || "Not Set"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <span className="text-zinc-500 font-medium">Current Address:</span>
            <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">
              {[member.city, member.subcity, member.zone, member.district].filter(Boolean).join(", ") || "No address on file"}
            </p>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Destination Fellowship */}
            <FormField id="toFellowshipId" label="Destination Council Fellowship *" required>
              <Select
                value={toFellowshipId}
                onChange={(e) => handleFellowshipChange(e.target.value)}
                disabled={fellowshipsLoading}
              >
                <option value="">-- Select Destination Fellowship --</option>
                {fellowships.map((f) => (
                  <option
                    key={f.id}
                    value={f.id}
                    disabled={f.id === member.councilFellowshipId}
                  >
                    {f.name} {f.id === member.councilFellowshipId ? "(Current)" : ""}
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Destination Region */}
            <FormField id="toRegionId" label="Destination Region">
              <Select
                value={toRegionId}
                onChange={(e) => setToRegionId(e.target.value)}
              >
                <option value="">-- Select Region (Optional) --</option>
                {regionOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.description || r.value}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Transfer Type */}
            <FormField id="transferType" label="Transfer Reason Type *" required>
              <Select
                value={transferType}
                onChange={(e) => handleTypeChange(e.target.value as any)}
              >
                <option value="REDISTRICTING">Redistricting / Boundary Adjustment</option>
                <option value="RELOCATION">Physical Church Relocation</option>
                <option value="ADMINISTRATIVE">Administrative Reorganization</option>
                <option value="OTHER">Other Reason</option>
              </Select>
            </FormField>

            {/* Effective Date */}
            <FormField id="effectiveDate" label="Effective Date *" required>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </FormField>
          </div>

          {/* Reference Number */}
          <FormField id="referenceNumber" label="Official Reference / Minute Resolution #">
            <Input
              type="text"
              placeholder="e.g. ECGBC-SYN-2026/042 or Board Minute Ref"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </FormField>

          {/* Rationale / Notes */}
          <FormField id="reason" label="Transfer Rationale / Notes">
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide background context for this transfer..."
              className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
          </FormField>

          {/* Location / Physical Relocation Accordion Toggle */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={updateAddress}
                  onChange={(e) => setUpdateAddress(e.target.checked)}
                  className="rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                />
                Update Church Physical Address (Relocation)
              </label>
              {updateAddress && (
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                  Address will be updated on member record
                </span>
              )}
            </div>

            {updateAddress && (
              <div className="mt-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-500 mb-1">City</label>
                  <Input
                    type="text"
                    value={toCity}
                    onChange={(e) => setToCity(e.target.value)}
                    placeholder="City / Town"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Subcity</label>
                  <Input
                    type="text"
                    value={toSubcity}
                    onChange={(e) => setToSubcity(e.target.value)}
                    placeholder="Subcity"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Zone</label>
                  <Input
                    type="text"
                    value={toZone}
                    onChange={(e) => setToZone(e.target.value)}
                    placeholder="Zone"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Woreda / District</label>
                  <Input
                    type="text"
                    value={toDistrict}
                    onChange={(e) => setToDistrict(e.target.value)}
                    placeholder="District / Woreda"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-zinc-500 mb-1">House Number</label>
                  <Input
                    type="text"
                    value={toHouseNumber}
                    onChange={(e) => setToHouseNumber(e.target.value)}
                    placeholder="House Number"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <ModalFooter className="mt-4 flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !toFellowshipId}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Transferring Church...
              </>
            ) : (
              <>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Execute Transfer
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
