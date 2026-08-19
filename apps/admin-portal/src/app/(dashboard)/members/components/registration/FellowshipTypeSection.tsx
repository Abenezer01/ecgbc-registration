import React from "react";
import { FormField, Select } from "@/components/ui";
import { RegistrationFormState, DataLookup } from "./types";

interface FellowshipTypeSectionProps {
  form: RegistrationFormState;
  setForm: React.Dispatch<React.SetStateAction<RegistrationFormState>>;
  errors: Record<string, string>;
  fellowshipOptions: any[];
  memberTypeOptions: DataLookup[];
}

export function FellowshipTypeSection({ form, setForm, errors, fellowshipOptions, memberTypeOptions }: FellowshipTypeSectionProps) {
  const setField = (field: keyof RegistrationFormState) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
        Fellowship & Type
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField id="cf-id" label="ካውንስል ፌሎሺፕ (Council Fellowship)" error={errors.councilFellowshipId} required>
          <Select id="cf-id" value={form.councilFellowshipId} onChange={setField("councilFellowshipId")}>
            <option value="">Choose Fellowship...</option>
            {fellowshipOptions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </FormField>

        <FormField id="isInEthiopia" label="Location Type (የተቋሙ አድራሻ)">
          <Select id="isInEthiopia" value={form.isInEthiopia ? "true" : "false"}
            onChange={(e) => setForm((p) => ({ ...p, isInEthiopia: e.target.value === "true", regionId: "", country: "" }))}>
            <option value="true">Ethiopia (ሀገር ውስጥ)</option>
            <option value="false">Outside Ethiopia (የውጭ ሃገር ተቋም)</option>
          </Select>
        </FormField>

        <FormField id="typeId" label="የተቋሙ አይነት (Member Type)" error={errors.typeId} required>
          <Select id="typeId" value={form.typeId} onChange={setField("typeId")}>
            <option value="">Select Type...</option>
            {memberTypeOptions.map((t) => <option key={t.id} value={t.id}>{t.description}</option>)}
          </Select>
        </FormField>
      </div>
    </div>
  );
}
