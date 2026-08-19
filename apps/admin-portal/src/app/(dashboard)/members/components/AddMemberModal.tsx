"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Drawer, Button } from "@/components/ui";
import { useCreateMember } from "@/hooks/useMembers";
import { useNameReservation } from "@/hooks/useNameReservation";
import { useFellowships } from "@/hooks/useFellowships";
import { useDataLookups } from "@/hooks/useDataLookups";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import {
  memberRegistrationSchema,
  validateFiles,
  zodErrorsToRecord,
} from "@/lib/validation/member-registration.schema";

import { RegistrationFormState, INITIAL_FORM, BoardMember } from "./registration/types";
import { RegistrationProgress } from "./registration/RegistrationProgress";
import { FellowshipTypeSection } from "./registration/FellowshipTypeSection";
import { OrganizationDetailsSection } from "./registration/OrganizationDetailsSection";
import { BoardMembersSection } from "./registration/BoardMembersSection";
import { AddressContactSection } from "./registration/AddressContactSection";
import { ContactPersonSection } from "./registration/ContactPersonSection";
import { FilesSection } from "./registration/FilesSection";

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddMemberModal({ open, onClose }: AddMemberModalProps) {
  const router = useRouter();
  const { staff, rbac } = useAuth();
  const staffIsOwner = staff?.role?.type?.value === "role_type_owner";

  const { data: fellowshipsData } = useFellowships({ limit: 100 });
  const { data: lookups = [] } = useDataLookups();
  const { mutateAsync: createMember, isPending: submitting } = useCreateMember();

  const [form, setForm] = useState<RegistrationFormState>(INITIAL_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [fileCategories, setFileCategories] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [perFileErrors, setPerFileErrors] = useState<Record<number, string>>({});

  const { checkName } = useNameReservation();
  const [similarityWarning, setSimilarityWarning] = useState<string | null>(null);
  const [nameBlocked, setNameBlocked] = useState(false);

  // Board Member specific state
  const [boardName, setBoardName] = useState("");
  const [boardNameEn, setBoardNameEn] = useState("");
  const [boardPhone, setBoardPhone] = useState("");
  const [boardTitleId, setBoardTitleId] = useState("");
  const [boardErrors, setBoardErrors] = useState<Record<string, string>>({});
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);

  // Computed Lookups
  const memberTypeOptions = lookups.filter((l) => l.type === "member_type");
  const regionOptions = lookups.filter((l) => l.type === "region");
  const stateOptions = lookups.filter((l) => l.type === "object_state" && l.value !== "object_state_deleted");
  const boardTitleOptions = lookups.filter((l) => l.type === "board_title");
  const fileCategoryOptions = lookups.filter((l) => l.type === "Document Type");
  const requiredCategoryIds = fileCategoryOptions.filter((c) => c.isRequired).map((c) => c.id);

  const fellowshipOptions = useMemo(() => {
    const list = fellowshipsData?.fellowships || [];
    if (staffIsOwner) return list;
    const allowed = rbac?.allowedFellowshipIds || [];
    return list.filter((f) => allowed.includes(f.id));
  }, [fellowshipsData, staffIsOwner, rbac]);

  // Initial State Setup
  useEffect(() => {
    if (lookups.length > 0 && !form.stateId) {
      const draftState = lookups.find((l) => l.value === "object_state_draft");
      if (draftState) setForm((prev) => ({ ...prev, stateId: draftState.id }));
    }
  }, [lookups, form.stateId]);

  useEffect(() => {
    if (fellowshipOptions.length === 1 && !form.councilFellowshipId) {
      setForm((prev) => ({ ...prev, councilFellowshipId: fellowshipOptions[0].id }));
    }
  }, [fellowshipOptions, form.councilFellowshipId]);

  // Debounced name check
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (form.name.trim().length > 2) {
        try {
          const res = await checkName({ nameAm: form.name, nameEn: form.nameEn });
          if (res && res.length > 0) {
            const top = res[0];
            if (top.score === 100) {
              setSimilarityWarning(null);
              setNameBlocked(true);
              setErrors((prev) => ({ ...prev, name: `Exact match found: "${top.nameAm}" already exists.` }));
            } else if (top.score >= 85) {
              setSimilarityWarning(`⚠ High similarity (${top.score}%) with existing ${top.entityType.toLowerCase()}: "${top.nameAm}"`);
              setNameBlocked(false);
              setErrors((prev) => { const c = { ...prev }; delete c.name; return c; });
            } else {
              setSimilarityWarning(null);
              setNameBlocked(false);
              setErrors((prev) => { const c = { ...prev }; delete c.name; return c; });
            }
          } else {
            setSimilarityWarning(null);
            setNameBlocked(false);
          }
        } catch { /* ignore */ }
      } else {
        setSimilarityWarning(null);
        setNameBlocked(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [form.name, form.nameEn, checkName]);

  // General Field Validation
  const validateField = (field: string, value: string) => {
    const partial = memberRegistrationSchema.safeParse({ ...form, [field]: value, boardMembers: form.boardMembers });
    if (!partial.success) {
      const fieldError = partial.error.issues.find((i) => i.path[0] === field);
      if (fieldError) setErrors((prev) => ({ ...prev, [field]: fieldError.message }));
      else setErrors((prev) => { const c = { ...prev }; delete c[field]; return c; });
    } else {
      setErrors((prev) => { const c = { ...prev }; delete c[field]; return c; });
    }
  };

  const handleBlurCertificate = async () => {
    const certNo = form.certificateNo.trim();
    validateField("certificateNo", certNo);
    if (!certNo || !/^\d+$/.test(certNo)) return;
    try {
      const res = await api.get(`/members/check-certificate/${certNo}`);
      if ((res.data as any).data?.exists) {
        setErrors((prev) => ({ ...prev, certificateNo: `Certificate number ${certNo} is already registered` }));
      }
    } catch { /* ignore */ }
  };

  // Board Member Actions
  const handleAddBoardMember = () => {
    const be: Record<string, string> = {};
    if (!boardName.trim() || boardName.trim().length < 2) be.boardName = "Name must be at least 2 characters";
    if (!boardPhone.trim()) be.boardPhone = "Phone is required";
    if (!boardTitleId) be.boardTitleId = "Title is required";
    setBoardErrors(be);
    if (Object.keys(be).length > 0) return;

    const dup = form.boardMembers.find((bm) => bm.phoneNumber === boardPhone && bm.id !== editingBoardId);
    if (dup) { setBoardErrors({ boardPhone: "This phone number is already used" }); return; }

    const newBm = {
      id: editingBoardId || Math.random().toString(36).substr(2, 9),
      fullName: boardName, fullNameEn: boardNameEn,
      phoneNumber: boardPhone, titleId: boardTitleId,
    };

    if (editingBoardId) {
      setForm((p) => ({ ...p, boardMembers: p.boardMembers.map((bm) => (bm.id === editingBoardId ? newBm : bm)) }));
      setEditingBoardId(null);
    } else {
      setForm((p) => ({ ...p, boardMembers: [...p.boardMembers, newBm] }));
    }
    setBoardName(""); setBoardNameEn(""); setBoardPhone(""); setBoardTitleId(""); setBoardErrors({});
    setErrors((prev) => { const c = { ...prev }; delete c.boardMembers; return c; });
  };

  const handleEditBoardMember = (bm: BoardMember) => {
    setEditingBoardId(bm.id);
    setBoardName(bm.fullName); setBoardNameEn(bm.fullNameEn || "");
    setBoardPhone(bm.phoneNumber); setBoardTitleId(bm.titleId || "");
    setBoardErrors({});
  };

  const handleDeleteBoardMember = (id: string) => {
    setForm((p) => ({ ...p, boardMembers: p.boardMembers.filter((bm) => bm.id !== id) }));
  };

  // File Actions
  const runFileValidation = useCallback((newFiles: File[], newCategories: Record<number, string>) => {
    const { errors: fe, perFileErrors: pfe } = validateFiles(newFiles, newCategories, requiredCategoryIds);
    setFileErrors(fe);
    setPerFileErrors(pfe);
  }, [requiredCategoryIds]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    const merged = [...files];
    for (const f of incoming) {
      if (!merged.some((m) => m.name === f.name && m.size === f.size)) merged.push(f);
    }
    setFiles(merged);
    runFileValidation(merged, fileCategories);
  };

  const handleCategoryChange = (idx: number, catId: string) => {
    const next = { ...fileCategories, [idx]: catId };
    setFileCategories(next);
    runFileValidation(files, next);
  };

  const handleRemoveFile = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    const nextCats: Record<number, string> = {};
    Object.entries(fileCategories).forEach(([k, v]) => {
      const ki = parseInt(k);
      if (ki < idx) nextCats[ki] = v;
      else if (ki > idx) nextCats[ki - 1] = v;
    });
    setFiles(next);
    setFileCategories(nextCats);
    runFileValidation(next, nextCats);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameBlocked) return;

    const result = memberRegistrationSchema.safeParse(form);
    if (!result.success) {
      setErrors(zodErrorsToRecord(result.error));
      setTimeout(() => document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return;
    }

    const { errors: fe, perFileErrors: pfe } = validateFiles(files, fileCategories, requiredCategoryIds);
    const hasBlockingFileErrors = Object.keys(pfe).length > 0;
    setFileErrors(fe);
    setPerFileErrors(pfe);
    if (hasBlockingFileErrors) return;

    try {
      const created = await createMember({ newMember: form, files, fileCategories });
      router.push(`/members/${created.id}`);
      onClose();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const be: Record<string, string> = {};
        err.response.data.errors.forEach((itm: any) => {
          be[itm.path || itm.param || itm.field || "name"] = itm.msg || itm.message;
        });
        setErrors(be);
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
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form="add-member-form" disabled={submitting || nameBlocked}>
            {submitting ? "Registering..." : "Register Member"}
          </Button>
        </>
      }
    >
      <form id="add-member-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
        
        <RegistrationProgress form={form} errors={errors} />

        <FellowshipTypeSection 
          form={form} 
          setForm={setForm} 
          errors={errors} 
          fellowshipOptions={fellowshipOptions} 
          memberTypeOptions={memberTypeOptions} 
        />

        <OrganizationDetailsSection 
          form={form} 
          setForm={setForm} 
          errors={errors} 
          validateField={validateField} 
          handleBlurCertificate={handleBlurCertificate} 
          similarityWarning={similarityWarning} 
          nameBlocked={nameBlocked} 
        />

        <BoardMembersSection 
          form={form} 
          errors={errors} 
          boardTitleOptions={boardTitleOptions}
          boardName={boardName} setBoardName={setBoardName}
          boardNameEn={boardNameEn} setBoardNameEn={setBoardNameEn}
          boardPhone={boardPhone} setBoardPhone={setBoardPhone}
          boardTitleId={boardTitleId} setBoardTitleId={setBoardTitleId}
          boardErrors={boardErrors}
          editingBoardId={editingBoardId}
          handleAddBoardMember={handleAddBoardMember}
          handleEditBoardMember={handleEditBoardMember}
          handleDeleteBoardMember={handleDeleteBoardMember}
        />

        <AddressContactSection 
          form={form} 
          setForm={setForm} 
          errors={errors} 
          validateField={validateField} 
          regionOptions={regionOptions} 
          stateOptions={stateOptions} 
        />

        <ContactPersonSection 
          form={form} 
          setForm={setForm} 
          errors={errors} 
          validateField={validateField} 
        />

        <FilesSection 
          files={files} setFiles={setFiles}
          fileCategories={fileCategories} setFileCategories={setFileCategories}
          fileErrors={fileErrors} setFileErrors={setFileErrors}
          perFileErrors={perFileErrors} setPerFileErrors={setPerFileErrors}
          fileCategoryOptions={fileCategoryOptions}
          handleFileChange={handleFileChange}
          handleCategoryChange={handleCategoryChange}
          handleRemoveFile={handleRemoveFile}
        />

      </form>
    </Drawer>
  );
}
