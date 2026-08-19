import React from "react";
import { FormField, Input, Select, PhoneInput } from "@/components/ui";
import { RegistrationFormState } from "./types";

interface ContactPersonSectionProps {
  form: RegistrationFormState;
  setForm: React.Dispatch<React.SetStateAction<RegistrationFormState>>;
  errors: Record<string, string>;
  validateField: (field: string, value: string) => void;
}

export function ContactPersonSection({ form, setForm, errors, validateField }: ContactPersonSectionProps) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
          ዋና ተወካይ (Contact Person) — Optional
        </h4>
        {form.boardMembers.length > 0 && (
          <div className="w-56">
            <Select
              value=""
              onChange={(e) => {
                const bm = form.boardMembers.find((b) => b.id === e.target.value);
                if (bm)
                  setForm((p) => ({
                    ...p,
                    contactPersonFullName: bm.fullName,
                    contactPersonPhoneNumber: bm.phoneNumber,
                  }));
              }}
              className="!py-1.5 !text-xs"
            >
              <option value="">Copy from board member...</option>
              {form.boardMembers.map((bm) => (
                <option key={bm.id} value={bm.id}>{bm.fullName}</option>
              ))}
            </Select>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField id="cp-fullname" label="ሙሉ ስም (Full Name)">
          <Input
            id="cp-fullname"
            value={form.contactPersonFullName}
            onChange={(e) => setForm((p) => ({ ...p, contactPersonFullName: e.target.value }))}
            placeholder="Contact person full name"
          />
        </FormField>
        <FormField id="cp-phone" label="ስልክ (Phone)" error={errors.contactPersonPhoneNumber}>
          <PhoneInput
            id="cp-phone"
            value={form.contactPersonPhoneNumber}
            onChange={(val) => setForm((p) => ({ ...p, contactPersonPhoneNumber: val }))}
          />
        </FormField>
        <FormField id="cp-email" label="ኢሜይል (Email)" error={errors.contactPersonEmail}>
          <Input
            id="cp-email"
            type="email"
            value={form.contactPersonEmail}
            onChange={(e) => setForm((p) => ({ ...p, contactPersonEmail: e.target.value }))}
            onBlur={(e) => validateField("contactPersonEmail", e.target.value)}
            placeholder="Contact person email"
          />
        </FormField>
      </div>
    </div>
  );
}
