"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  Drawer, Button, Input, DateInput, FormField, Select, Label, RowActions, presets, PhoneInput,
} from "@/components/ui";
import { useUpdateMember } from "@/hooks/useMembers";
import { useFellowships } from "@/hooks/useFellowships";
import { useDataLookups } from "@/hooks/useDataLookups";
import { useAuth } from "@/hooks/useAuth";
import { countries } from "@/lib/countries";

interface EditMemberModalProps {
  open: boolean;
  onClose: () => void;
  member: any; // The full member object to pre-populate
}

export function EditMemberModal({ open, onClose, member }: EditMemberModalProps) {
  const { staff, rbac } = useAuth();
  const staffIsOwner = staff?.role?.type?.value === "role_type_owner";

  const { data: fellowshipsData } = useFellowships({ limit: 100 });
  const { data: lookups = [] } = useDataLookups();
  const { mutateAsync: updateMember, isPending: submitting } = useUpdateMember();

  const memberTypeOptions = lookups.filter((l) => l.type === "member_type");
  const regionOptions = lookups.filter((l) => l.type === "region");
  const stateOptions = lookups.filter((l) => l.type === "object_state" && l.value !== "object_state_deleted");
  const boardTitleOptions = lookups.filter((l) => l.type === "board_title");

  const fellowshipOptions = useMemo(() => {
    const list = fellowshipsData?.fellowships || [];
    if (staffIsOwner) return list;
    const allowed = rbac?.allowedFellowshipIds || [];
    return list.filter((f) => allowed.includes(f.id));
  }, [fellowshipsData, staffIsOwner, rbac]);

  // ─── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: "",
    nameEn: "",
    certificateNo: "",
    councilFellowshipId: "",
    typeId: "",
    stateId: "",
    isInEthiopia: true,
    certificateIssuedDate: "",
    country: "",
    regionId: "",
    city: "",
    subcity: "",
    zone: "",
    district: "",
    houseNumber: "",
    poBoxNumber: "",
    phoneNumber: "",
    email: "",
    boardMembers: [] as {
      id: string;
      fullName: string;
      fullNameEn: string;
      phoneNumber: string;
      titleId: string;
    }[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Board member input fields
  const [boardName, setBoardName] = useState("");
  const [boardNameEn, setBoardNameEn] = useState("");
  const [boardPhone, setBoardPhone] = useState("");
  const [boardTitleId, setBoardTitleId] = useState("");
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);

  // ─── Pre-populate when modal opens / member changes ─────────────────────────
  useEffect(() => {
    if (!member || !open) return;

    // Normalize certificateIssuedDate to yyyy-MM-dd for the date input
    let issuedDate = "";
    if (member.certificateIssuedDate) {
      try {
        const d = new Date(member.certificateIssuedDate);
        const y = d.getFullYear();
        const mo = (d.getMonth() + 1).toString().padStart(2, "0");
        const da = d.getDate().toString().padStart(2, "0");
        issuedDate = `${y}-${mo}-${da}`;
      } catch {
        issuedDate = "";
      }
    }

    const normalizedBoardMembers = (member.boardMembers || []).map((bm: any) => ({
      id: bm.id,
      fullName: bm.fullName || "",
      fullNameEn: bm.fullNameEn || "",
      phoneNumber: bm.phoneNumber || "",
      titleId: bm.titleId || bm.title?.id || "",
    }));

    setForm({
      name: member.name || "",
      nameEn: member.nameEn || "",
      certificateNo: member.certificateNo || "",
      councilFellowshipId: member.councilFellowshipId || member.councilFellowship?.id || "",
      typeId: member.typeId || member.type?.id || "",
      stateId: member.stateId || member.state?.id || "",
      isInEthiopia: member.isInEthiopia !== undefined ? Boolean(member.isInEthiopia) : true,
      certificateIssuedDate: issuedDate,
      country: member.country || "",
      regionId: member.regionId || member.region?.id || "",
      city: member.city || "",
      subcity: member.subcity || "",
      zone: member.zone || "",
      district: member.district || "",
      houseNumber: member.houseNumber || "",
      poBoxNumber: member.poBoxNumber || "",
      phoneNumber: member.phoneNumber || "",
      email: member.email || "",
      boardMembers: normalizedBoardMembers,
    });

    setErrors({});
    setBoardName("");
    setBoardNameEn("");
    setBoardPhone("");
    setBoardTitleId("");
    setEditingBoardId(null);
  }, [member, open]);

  // ─── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.councilFellowshipId) e.councilFellowshipId = "Council Fellowship is required";
    if (!form.typeId) e.typeId = "Member Type is required";
    if (!form.name.trim()) e.name = "Organization name is required";
    if (!form.certificateNo.trim()) e.certificateNo = "Certificate number is required";
    if (!/^\d+$/.test(form.certificateNo.trim())) e.certificateNo = "Must contain digits only";
    if (!form.certificateIssuedDate) e.certificateIssuedDate = "Issued date is required";
    if (form.isInEthiopia && !form.regionId) e.regionId = "Region is required";
    if (!form.isInEthiopia && !form.country) e.country = "Country is required";
    if (!form.city.trim()) e.city = "City is required";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email format";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Board members ──────────────────────────────────────────────────────────
  const handleAddBoardMember = () => {
    if (!boardName.trim() || !boardPhone.trim() || !boardTitleId) return;

    const newBm = {
      id: editingBoardId || Math.random().toString(36).substr(2, 9),
      fullName: boardName,
      fullNameEn: boardNameEn,
      phoneNumber: boardPhone,
      titleId: boardTitleId,
    };

    if (editingBoardId) {
      setForm((p) => ({
        ...p,
        boardMembers: p.boardMembers.map((bm) => (bm.id === editingBoardId ? newBm : bm)),
      }));
      setEditingBoardId(null);
    } else {
      setForm((p) => ({ ...p, boardMembers: [...p.boardMembers, newBm] }));
    }
    setBoardName("");
    setBoardNameEn("");
    setBoardPhone("");
    setBoardTitleId("");
  };

  const handleEditBoardMember = (bm: any) => {
    setEditingBoardId(bm.id);
    setBoardName(bm.fullName);
    setBoardNameEn(bm.fullNameEn || "");
    setBoardPhone(bm.phoneNumber);
    setBoardTitleId(bm.titleId || "");
  };

  const handleDeleteBoardMember = (id: string) => {
    setForm((p) => ({
      ...p,
      boardMembers: p.boardMembers.filter((bm) => bm.id !== id),
    }));
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await updateMember({ id: member.id, data: form });
      onClose();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        err.response.data.errors.forEach((itm: any) => {
          backendErrors[itm.path || itm.param || itm.field || "name"] = itm.msg || itm.message;
        });
        setErrors(backendErrors);
      }
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit Member"
      description="Update the member's registration details."
      size="2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="edit-member-form" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="edit-member-form" onSubmit={handleSubmit} className="space-y-6" noValidate>

        {/* ── Fellowship & Type ──────────────────────────────────────────────── */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
            Fellowship & Type
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField id="cf-id" label="ካውንስል ፌሎሺፕ (Council Fellowship)" error={errors.councilFellowshipId} required>
              <Select
                id="cf-id"
                value={form.councilFellowshipId}
                onChange={(e) => setForm((p) => ({ ...p, councilFellowshipId: e.target.value }))}
              >
                <option value="">Choose Fellowship...</option>
                {fellowshipOptions.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Select>
            </FormField>

            <FormField id="isInEthiopia" label="የውጭ ሃገር ተቋም (Location Type)">
              <div className="flex items-center gap-3 h-10">
                <input
                  type="checkbox"
                  id="isInEthiopia"
                  checked={!form.isInEthiopia}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isInEthiopia: !e.target.checked, regionId: "", country: "" }))
                  }
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="isInEthiopia" className="cursor-pointer">
                  {form.isInEthiopia ? "Ethiopia (ሀገር ውስጥ)" : "Outside Ethiopia (የውጭ ሃገር)"}
                </Label>
              </div>
            </FormField>

            <FormField id="typeId" label="የተቋሙ አይነት (Member Type)" error={errors.typeId} required>
              <Select
                id="typeId"
                value={form.typeId}
                onChange={(e) => setForm((p) => ({ ...p, typeId: e.target.value }))}
              >
                <option value="">Select Type...</option>
                {memberTypeOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.description}</option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>

        {/* ── Organization Details ───────────────────────────────────────────── */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
            Organization Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="name" label="የተቋሙ ስም (Organization Name)" error={errors.name} required>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="ስም ያስገቡ"
              />
            </FormField>

            <FormField id="nameEn" label="Organization Name (English)">
              <Input
                id="nameEn"
                value={form.nameEn}
                onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))}
                placeholder="Enter English name"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="cert-no" label="የሰርቲፊኬት ቁጥር (Certificate No)" error={errors.certificateNo} required>
              <Input
                id="cert-no"
                value={form.certificateNo}
                onChange={(e) => setForm((p) => ({ ...p, certificateNo: e.target.value }))}
                placeholder="e.g. 01410"
                maxLength={12}
              />
            </FormField>

            <FormField id="issued-date" label="ሰርተፊኬት የወሰዱበት ቀን (Issued Date)" error={errors.certificateIssuedDate} required>
              <DateInput
                id="issued-date"
                value={form.certificateIssuedDate}
                onChange={(e) => setForm((p) => ({ ...p, certificateIssuedDate: e.target.value }))}
              />
            </FormField>
          </div>
        </div>

        {/* ── Board Members ──────────────────────────────────────────────────── */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
            የቦርድ አባላት (Board Members)
          </h4>

          {form.boardMembers.length > 0 && (
            <div className="space-y-2">
              {form.boardMembers.map((bm) => (
                <div
                  key={bm.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex gap-4 text-sm font-medium items-center">
                    <span className="text-zinc-950 dark:text-white">{bm.fullName}</span>
                    {bm.fullNameEn && (
                      <span className="text-zinc-400 text-xs">{bm.fullNameEn}</span>
                    )}
                    {bm.titleId && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs border border-zinc-200 dark:border-zinc-700">
                        {(() => {
                          const t = boardTitleOptions.find((t) => t.id === bm.titleId);
                          return t ? (t.note ? `${t.description} (${t.note})` : t.description) : "Unknown Title";
                        })()}
                      </span>
                    )}
                    <span className="text-zinc-500">{bm.phoneNumber}</span>
                  </div>
                  <RowActions
                    actions={[
                      presets.edit({ onClick: () => handleEditBoardMember(bm), allowed: true }),
                      presets.delete({ onClick: () => handleDeleteBoardMember(bm.id), allowed: true, confirm: "Remove this board member?" }),
                    ]}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {/* Row 1: Title + Amharic name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField id="bm-title" label="የቦርድ ኃላፊነት (Title)">
                <Select id="bm-title" value={boardTitleId} onChange={(e) => setBoardTitleId(e.target.value)}>
                  <option value="">Select Title...</option>
                  {boardTitleOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.note ? `${t.description} (${t.note})` : t.description}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField id="bm-name" label="ስም (Amharic)">
                <Input
                  id="bm-name"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="ሙሉ ስም"
                />
              </FormField>
            </div>
            {/* Row 2: English name + Phone + Add/Update */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <FormField id="bm-name-en" label="Name (English)">
                <Input
                  id="bm-name-en"
                  value={boardNameEn}
                  onChange={(e) => setBoardNameEn(e.target.value)}
                  placeholder="Full name in English"
                />
              </FormField>
              <FormField id="bm-phone" label="ስልክ (Phone)">
                <PhoneInput
                  id="bm-phone"
                  value={boardPhone}
                  onChange={(val) => setBoardPhone(val)}
                />
              </FormField>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddBoardMember}
                disabled={!boardName.trim() || !boardPhone.trim() || !boardTitleId}
                className="w-full"
              >
                {editingBoardId ? "Update" : <><Plus className="h-4 w-4 mr-1" />Add</>}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Address & Contact ──────────────────────────────────────────────── */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
            አድራሻ & ኮንታክት (Address & Contact)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {form.isInEthiopia ? (
              <FormField id="regionId" label="ክልል/ከተማ አስተዳደር (Region)" error={errors.regionId} required>
                <Select
                  id="regionId"
                  value={form.regionId}
                  onChange={(e) => setForm((p) => ({ ...p, regionId: e.target.value }))}
                >
                  <option value="">Select Region...</option>
                  {regionOptions.map((r) => (
                    <option key={r.id} value={r.id}>{r.description}</option>
                  ))}
                </Select>
              </FormField>
            ) : (
              <FormField id="country" label="ሀገር (Country)" error={errors.country} required>
                <Select
                  id="country"
                  value={form.country}
                  onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                >
                  <option value="">Select Country...</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </FormField>
            )}

            <FormField id="city" label="ከተማ (City)" error={errors.city} required>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                placeholder="Enter city"
              />
            </FormField>

            <FormField id="phone" label="ስልክ ቁጥር (Phone Number)" error={errors.phoneNumber}>
              <PhoneInput
                id="phone"
                value={form.phoneNumber}
                onChange={(val) => setForm((p) => ({ ...p, phoneNumber: val }))}
                error={errors.phoneNumber}
              />
            </FormField>

            <FormField id="email" label="ኢሜይል (Email)" error={errors.email}>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Enter email"
              />
            </FormField>

            <FormField id="stateId" label="State Status">
              <Select
                id="stateId"
                value={form.stateId}
                onChange={(e) => setForm((p) => ({ ...p, stateId: e.target.value }))}
              >
                <option value="">Select State...</option>
                {stateOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.description}</option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* Extended address fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField id="subcity" label="ክፍለ ከተማ (Subcity)">
              <Input
                id="subcity"
                value={form.subcity}
                onChange={(e) => setForm((p) => ({ ...p, subcity: e.target.value }))}
                placeholder="Subcity"
              />
            </FormField>
            <FormField id="zone" label="ዞን (Zone)">
              <Input
                id="zone"
                value={form.zone}
                onChange={(e) => setForm((p) => ({ ...p, zone: e.target.value }))}
                placeholder="Zone"
              />
            </FormField>
            <FormField id="district" label="ወረዳ (District)">
              <Input
                id="district"
                value={form.district}
                onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
                placeholder="District / Woreda"
              />
            </FormField>
            <FormField id="houseNumber" label="የቤት ቁጥር (House No)">
              <Input
                id="houseNumber"
                value={form.houseNumber}
                onChange={(e) => setForm((p) => ({ ...p, houseNumber: e.target.value }))}
                placeholder="House number"
              />
            </FormField>
            <FormField id="poBoxNumber" label="ፖ.ሳ.ቁ (P.O. Box)">
              <Input
                id="poBoxNumber"
                value={form.poBoxNumber}
                onChange={(e) => setForm((p) => ({ ...p, poBoxNumber: e.target.value }))}
                placeholder="P.O. Box"
              />
            </FormField>
          </div>
        </div>

      </form>
    </Drawer>
  );
}
