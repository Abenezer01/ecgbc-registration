import React from "react";
import { FormField, Select, Input, PhoneInput } from "@/components/ui";
import { RegistrationFormState, DataLookup } from "./types";
import { countries } from "@/lib/countries";

interface AddressContactSectionProps {
  form: RegistrationFormState;
  setForm: React.Dispatch<React.SetStateAction<RegistrationFormState>>;
  errors: Record<string, string>;
  validateField: (field: string, value: string) => void;
  regionOptions: DataLookup[];
  stateOptions: DataLookup[];
}

export function AddressContactSection({
  form,
  setForm,
  errors,
  validateField,
  regionOptions,
  stateOptions,
}: AddressContactSectionProps) {
  const setField = (field: keyof RegistrationFormState) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
        አድራሻ & ኮንታክት (Address & Contact)
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {form.isInEthiopia ? (
          <FormField id="regionId" label="ክልል/ከተማ አስተዳደር (Region)" error={errors.regionId} required>
            <Select id="regionId" value={form.regionId} onChange={setField("regionId")}>
              <option value="">Select Region...</option>
              {regionOptions.map((r) => <option key={r.id} value={r.id}>{r.description}</option>)}
            </Select>
          </FormField>
        ) : (
          <FormField id="country" label="ሀገር (Country)" error={errors.country} required>
            <Select id="country" value={form.country} onChange={setField("country")}>
              <option value="">Select Country...</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FormField>
        )}

        <FormField id="city" label="ከተማ (City)" error={errors.city} required>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            onBlur={(e) => validateField("city", e.target.value)}
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
            onBlur={(e) => validateField("email", e.target.value)}
            placeholder="Enter email address"
          />
        </FormField>

        <FormField id="stateId" label="State Status">
          <Select id="stateId" value={form.stateId} onChange={setField("stateId")}>
            {stateOptions.map((s) => <option key={s.id} value={s.id}>{s.description}</option>)}
          </Select>
        </FormField>
      </div>
    </div>
  );
}
