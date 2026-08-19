import React from "react";
import { RegistrationFormState } from "./types";

interface RegistrationProgressProps {
  form: RegistrationFormState;
  errors: Record<string, string>;
}

export function getCompletionSections(form: RegistrationFormState, errors: Record<string, string>) {
  const sections = [
    { label: "Fellowship & Type", done: !!form.councilFellowshipId && !!form.typeId },
    { label: "Org Details", done: !!form.name && !!form.certificateNo && !!form.certificateIssuedDate && !errors.name && !errors.certificateNo && !errors.certificateIssuedDate },
    { label: "Board Members", done: form.boardMembers.length > 0 },
    { label: "Address", done: !!form.city && (form.isInEthiopia ? !!form.regionId : !!form.country) },
    { label: "Contact", done: true }, // optional
    { label: "Files", done: true }, // optional
  ];
  return sections;
}

export function RegistrationProgress({ form, errors }: RegistrationProgressProps) {
  const completionSections = getCompletionSections(form, errors);
  const completedCount = completionSections.filter((s) => s.done).length;

  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex gap-1.5 flex-1">
        {completionSections.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={`h-1.5 w-full rounded-full transition-colors ${s.done ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"}`} />
          </div>
        ))}
      </div>
      <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">
        {completedCount}/{completionSections.length} sections
      </span>
    </div>
  );
}
