"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, UploadCloud, FileText, X } from "lucide-react";
import {
  Drawer, Button, Input, DateInput, FormField, Select, Label, RowActions, presets, PhoneInput,
} from "@/components/ui";
import { useCreateMember } from "@/hooks/useMembers";
import { useFellowships } from "@/hooks/useFellowships";
import { useDataLookups } from "@/hooks/useDataLookups";
import { useAuth } from "@/hooks/useAuth";
import { countries } from "@/lib/countries";
import api from "@/lib/api";

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
}

const MAX_FILES = 5;
const MAX_TOTAL_SIZE_MB = 50;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

export function AddMemberModal({ open, onClose }: AddMemberModalProps) {
  const router = useRouter();
  const { staff, rbac } = useAuth();
  const staffIsOwner = staff?.role?.type?.value === "role_type_owner";

  const { data: fellowshipsData } = useFellowships({ limit: 100 });
  const { data: lookups = [] } = useDataLookups();
  const { mutateAsync: createMember, isPending: submitting } = useCreateMember();

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
    phoneNumber: "",
    email: "",
    isActive: true,
    boardMembers: [] as { id: string; fullName: string; fullNameEn: string; phoneNumber: string; titleId: string }[],
    // Contact Person
    contactPersonFullName: "",
    contactPersonPhoneNumber: "",
    contactPersonEmail: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [fileCategories, setFileCategories] = useState<Record<number, string>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Board Member fields
  const [boardName, setBoardName] = useState("");
  const [boardNameEn, setBoardNameEn] = useState("");
  const [boardPhone, setBoardPhone] = useState("");
  const [boardTitleId, setBoardTitleId] = useState("");
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);

  const memberTypeOptions = lookups.filter((l) => l.type === "member_type");
  const regionOptions = lookups.filter((l) => l.type === "region");
  const stateOptions = lookups.filter((l) => l.type === "object_state" && l.value !== "object_state_deleted");
  const boardTitleOptions = lookups.filter((l) => l.type === "board_title");
  const fileCategoryOptions = lookups.filter((l) => l.category === "FILE_TYPE" || l.type === "Document Type");

  // Filter fellowships based on role permissions
  const fellowshipOptions = useMemo(() => {
    const list = fellowshipsData?.fellowships || [];
    if (staffIsOwner) return list;
    const allowed = rbac?.allowedFellowshipIds || [];
    return list.filter((f) => allowed.includes(f.id));
  }, [fellowshipsData, staffIsOwner, rbac]);

  // Set defaults when lookups load
  useEffect(() => {
    if (lookups.length > 0 && !form.stateId) {
      const draftState = lookups.find((l) => l.value === "object_state_draft");
      if (draftState) {
        setForm((prev) => ({ ...prev, stateId: draftState.id }));
      }
    }
  }, [lookups, form.stateId]);

  // Select the single fellowship if user only has access to one
  useEffect(() => {
    if (fellowshipOptions.length === 1 && !form.councilFellowshipId) {
      setForm((prev) => ({ ...prev, councilFellowshipId: fellowshipOptions[0].id }));
    }
  }, [fellowshipOptions, form.councilFellowshipId]);

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

  const handleBlurCertificate = async () => {
    const certNo = form.certificateNo.trim();
    if (!certNo || !/^\d+$/.test(certNo)) return;

    try {
      const res = await api.get(`/members/check-certificate/${certNo}`);
      if (res.data.data.exists) {
        setErrors((prev) => ({
          ...prev,
          certificateNo: `Certificate number ${certNo} already exists`,
        }));
      } else {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.certificateNo;
          return copy;
        });
      }
    } catch {}
  };

  // Files Handler
  const validateAndMergeFiles = useCallback((incoming: File[]) => {
    setFileError(null);
    const merged = [...files];
    for (const f of incoming) {
      const exists = merged.some((m) => m.name === f.name && m.size === f.size);
      if (!exists) merged.push(f);
    }
    if (merged.length > MAX_FILES) {
      setFileError(`Maximum of ${MAX_FILES} files allowed.`);
      return;
    }
    const total = merged.reduce((acc, f) => acc + f.size, 0);
    if (total > MAX_TOTAL_SIZE_BYTES) {
      setFileError(`Total file size cannot exceed ${MAX_TOTAL_SIZE_MB}MB.`);
      return;
    }
    setFiles(merged);
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndMergeFiles(Array.from(e.target.files));
    }
  };

  // Add / Edit Board Member
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
      setForm((p) => ({
        ...p,
        boardMembers: [...p.boardMembers, newBm],
      }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Validate Required Files
    const requiredCategories = fileCategoryOptions.filter(c => c.isRequired);
    const uploadedCategoryIds = Object.values(fileCategories);
    
    const missingCategories = requiredCategories.filter(rc => !uploadedCategoryIds.includes(rc.id));
    
    if (missingCategories.length > 0) {
      setFileError(`Please upload the following required documents: ${missingCategories.map(c => c.description).join(", ")}`);
      return;
    }

    if (files.length === 0 && requiredCategories.length === 0) {
      setFileError("At least one document attachment is required.");
      return;
    }

    try {
      const created = await createMember({ newMember: form, files, fileCategories });
      router.push(`/members/${created.id}`);
      onClose();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        err.response.data.errors.forEach((itm: any) => {
          backendErrors[itm.field || "name"] = itm.msg || itm.message;
        });
        setErrors(backendErrors);
      }
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New Member Registration Form"
      description="Register a new church or ministry institution into the portal."
      size="2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="add-member-form" disabled={submitting}>
            {submitting ? "Registering..." : "Register Member"}
          </Button>
        </>
      }
    >
      <form id="add-member-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Section: Fellowship & Type */}
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
                  onChange={(e) => setForm((p) => ({ ...p, isInEthiopia: !e.target.checked, regionId: "", country: "" }))}
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

        {/* Section: Organization Details */}
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
                onBlur={handleBlurCertificate}
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

        {/* Section: Board Members */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
            የቦርድ አባላት (Board Members)
          </h4>

          {form.boardMembers.length > 0 && (
            <div className="space-y-2">
              {form.boardMembers.map((bm) => (
                <div key={bm.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <div className="flex gap-4 text-sm font-medium items-center">
                    <span className="text-zinc-950 dark:text-white">{bm.fullName}</span>
                    {bm.titleId && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs border border-zinc-200 dark:border-zinc-700">
                        {(() => {
                          const t = boardTitleOptions.find(t => t.id === bm.titleId);
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
              <FormField id="bm-title" label="ማዕረግ (Title)">
                <Select
                  id="bm-title"
                  value={boardTitleId}
                  onChange={(e) => setBoardTitleId(e.target.value)}
                >
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
            {/* Row 2: English name + Phone + Add button */}
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
                {editingBoardId ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </div>

        {/* Section: Address & Contact */}
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
                {stateOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.description}</option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>

        {/* Section: Contact Person */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
            ዋና ተወካይ (Contact Person)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField id="cp-fullname" label="ሙሉ ስም (Full Name)">
              <Input
                id="cp-fullname"
                value={form.contactPersonFullName}
                onChange={(e) => setForm((p) => ({ ...p, contactPersonFullName: e.target.value }))}
                placeholder="Contact person full name"
              />
            </FormField>
            <FormField id="cp-phone" label="ስልክ (Phone)">
              <PhoneInput
                id="cp-phone"
                value={form.contactPersonPhoneNumber}
                onChange={(val) => setForm((p) => ({ ...p, contactPersonPhoneNumber: val }))}
              />
            </FormField>
            <FormField id="cp-email" label="ኢሜይል (Email)">
              <Input
                id="cp-email"
                type="email"
                value={form.contactPersonEmail}
                onChange={(e) => setForm((p) => ({ ...p, contactPersonEmail: e.target.value }))}
                placeholder="Contact person email"
              />
            </FormField>
          </div>
        </div>

        {/* Section: Attachments */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
            ተያያዥ ፋይሎች (Member Files)
          </h4>

          {/* Required Documents Checklist */}
          {fileCategoryOptions.filter(c => c.isRequired).length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Required Documents:</p>
              <ul className="text-xs space-y-1 text-blue-700 dark:text-blue-400">
                {fileCategoryOptions.filter(c => c.isRequired).map(c => {
                  const isUploaded = Object.values(fileCategories).includes(c.id);
                  return (
                    <li key={c.id} className="flex items-center gap-2">
                      <span className={isUploaded ? "text-green-600 dark:text-green-400" : "text-zinc-400"}>
                        {isUploaded ? "☑" : "☐"}
                      </span>
                      <span className={isUploaded ? "line-through opacity-70" : ""}>{c.description}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {fileError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {fileError}
            </div>
          )}

          <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-white dark:bg-zinc-950 hover:bg-zinc-50/50 transition-colors relative">
            <input
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <UploadCloud className="h-10 w-10 text-zinc-400 mb-3" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Click or drag & drop files here to upload
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Supports: PDF, DOCX, XLSX, PNG, JPG (Max {MAX_FILES} files, {MAX_TOTAL_SIZE_MB}MB total)
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-zinc-500">
                <span>Selected Files ({files.length})</span>
                <button type="button" onClick={() => setFiles([])} className="hover:text-red-500">Clear All</button>
              </div>
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm">
                    <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-zinc-950 dark:text-white font-medium">{file.name}</p>
                      <p className="text-xs text-zinc-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    {fileCategoryOptions.length > 0 && (
                      <Select
                        id={`file-cat-${idx}`}
                        value={fileCategories[idx] || ""}
                        onChange={(e) => setFileCategories((prev) => ({ ...prev, [idx]: e.target.value }))}
                        className="w-44 text-xs"
                      >
                        <option value="">Select Category...</option>
                        {fileCategoryOptions.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.description} {c.isRequired ? "(Required)" : ""}
                          </option>
                        ))}
                      </Select>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFiles((prev) => prev.filter((_, i) => i !== idx));
                        setFileCategories((prev) => {
                          const next = { ...prev };
                          delete next[idx];
                          return next;
                        });
                      }}
                      className="text-zinc-400 hover:text-red-500 p-0.5 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </form>
    </Drawer>
  );
}
