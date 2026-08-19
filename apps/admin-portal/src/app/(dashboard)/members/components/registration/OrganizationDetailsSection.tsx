import React from "react";
import { AlertTriangle } from "lucide-react";
import { FormField, Input, DateInput } from "@/components/ui";
import { RegistrationFormState } from "./types";

interface OrganizationDetailsSectionProps {
  form: RegistrationFormState;
  setForm: React.Dispatch<React.SetStateAction<RegistrationFormState>>;
  errors: Record<string, string>;
  validateField: (field: string, value: string) => void;
  handleBlurCertificate: () => void;
  similarityWarning: string | null;
  nameBlocked: boolean;
}

export function OrganizationDetailsSection({
  form,
  setForm,
  errors,
  validateField,
  handleBlurCertificate,
  similarityWarning,
  nameBlocked,
}: OrganizationDetailsSectionProps) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
        Organization Details
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField id="name" label="ስም — Amharic" error={errors.name} required>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            onBlur={(e) => validateField("name", e.target.value)}
            placeholder="ቤተክርስቲያን ስም"
            className={nameBlocked ? "border-red-500" : similarityWarning ? "border-amber-400" : ""}
          />
          {similarityWarning && !nameBlocked && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {similarityWarning}
            </p>
          )}
        </FormField>

        <FormField id="nameEn" label="Name — English" error={errors.nameEn}>
          <Input
            id="nameEn"
            value={form.nameEn}
            onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))}
            onBlur={(e) => validateField("nameEn", e.target.value)}
            placeholder="Church name in English"
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
            onChange={(e) => {
              setForm((p) => ({ ...p, certificateIssuedDate: e.target.value }));
              validateField("certificateIssuedDate", e.target.value);
            }}
          />
        </FormField>
      </div>
    </div>
  );
}
