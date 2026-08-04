"use client";

/**
 * PhoneInput — wraps react-phone-number-input with the project's design tokens.
 *
 * - Country flag + name selector with search
 * - Formats the number as the user types (national or international format)
 * - value / onChange work with E.164 strings: "+2519XXXXXXXX"
 * - Defaults to Ethiopia (ET)
 * - Passes error styling through to the input border
 */

import React, { forwardRef } from "react";
import RawPhoneInput, {
  type Country,
  type Value,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

export interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  defaultCountry?: Country;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  defaultCountry = "ET",
  placeholder = "9XXXXXXXX",
  disabled,
  error,
  id,
  className,
}: PhoneInputProps) {
  return (
    <div className={cn("phone-input-wrapper", className)}>
      <RawPhoneInput
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        value={(value as Value) || undefined}
        onChange={(val) => onChange?.(val ?? "")}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        id={id}
        // Custom class names that map to Tailwind via global CSS below
        className={cn(
          "phone-input-root",
          error && "phone-input-error"
        )}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Scoped styles — override the library's default stylesheet */}
      <style>{`
        .phone-input-root {
          display: flex;
          align-items: center;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(228 228 231); /* zinc-200 */
          background: white;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .dark .phone-input-root {
          border-color: rgb(39 39 42); /* zinc-800 */
          background: rgb(9 9 11); /* zinc-950 */
        }
        .phone-input-root:focus-within {
          border-color: rgb(59 130 246); /* blue-500 */
          box-shadow: 0 0 0 3px rgb(59 130 246 / 0.15);
          outline: none;
        }
        .phone-input-error {
          border-color: rgb(248 113 113) !important; /* red-400 */
        }
        .phone-input-error:focus-within {
          box-shadow: 0 0 0 3px rgb(248 113 113 / 0.2) !important;
        }

        /* Country select button */
        .phone-input-root .PhoneInputCountry {
          display: flex;
          align-items: center;
          padding: 0 0.5rem 0 0.75rem;
          border-right: 1px solid rgb(228 228 231);
          gap: 4px;
          cursor: pointer;
          height: 2.5rem;
        }
        .dark .phone-input-root .PhoneInputCountry {
          border-right-color: rgb(39 39 42);
        }
        .phone-input-root .PhoneInputCountrySelect {
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          opacity: 0;
          cursor: pointer;
          width: 100%;
        }
        .phone-input-root .PhoneInputCountryIcon {
          width: 1.375rem;
          height: auto;
          border-radius: 2px;
          overflow: hidden;
        }
        .phone-input-root .PhoneInputCountryIcon--square {
          width: 1.375rem;
          height: 1.375rem;
        }
        .phone-input-root .PhoneInputCountrySelectArrow {
          width: 0.5rem;
          height: 0.5rem;
          border-right: 1.5px solid rgb(161 161 170);
          border-bottom: 1.5px solid rgb(161 161 170);
          transform: rotate(45deg) translateY(-2px);
          margin-left: 2px;
        }

        /* Number input */
        .phone-input-root .PhoneInputInput {
          flex: 1;
          min-width: 0;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
          background: transparent;
          border: none;
          outline: none;
          color: rgb(9 9 11); /* zinc-950 */
        }
        .dark .phone-input-root .PhoneInputInput {
          color: rgb(250 250 250); /* zinc-50 */
        }
        .phone-input-root .PhoneInputInput::placeholder {
          color: rgb(161 161 170); /* zinc-400 */
        }
        .phone-input-root .PhoneInputInput:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}
