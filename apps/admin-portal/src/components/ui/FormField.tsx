import * as React from "react";
import { cn } from "../../lib/utils";
import { Label } from "./Label";

export interface FormFieldProps {
  id: string;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * FormField wraps any form element (Input, Select, Textarea, Checkbox, etc.)
 * with a label, error message, and hint text in a consistent layout.
 *
 * Usage:
 *   <FormField id="email" label="Email" error={errors.email} required>
 *     <Input id="email" type="email" {...register("email")} />
 *   </FormField>
 */
export function FormField({ id, label, error, hint, required, className, children }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
