"use client";

/**
 * PhoneInput — professional phone number input with country dial-code selector.
 *
 * - Flag emoji + dial code dropdown (searchable)
 * - Outputs a combined E.164-style string: "+2519XXXXXXXX"
 * - `value` / `onChange` work with the full number string
 * - Defaults to Ethiopia (+251)
 * - Accessible: keyboard navigable, labelled, ARIA attributes
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Country data ─────────────────────────────────────────────────────────────

export interface CountryCode {
  code: string;   // ISO 3166-1 alpha-2
  name: string;
  dial: string;   // without leading +
  flag: string;   // emoji
}

export const COUNTRIES: CountryCode[] = [
  { code: "ET", name: "Ethiopia",              dial: "251",  flag: "🇪🇹" },
  { code: "ER", name: "Eritrea",               dial: "291",  flag: "🇪🇷" },
  { code: "KE", name: "Kenya",                 dial: "254",  flag: "🇰🇪" },
  { code: "UG", name: "Uganda",                dial: "256",  flag: "🇺🇬" },
  { code: "TZ", name: "Tanzania",              dial: "255",  flag: "🇹🇿" },
  { code: "SO", name: "Somalia",               dial: "252",  flag: "🇸🇴" },
  { code: "SD", name: "Sudan",                 dial: "249",  flag: "🇸🇩" },
  { code: "SS", name: "South Sudan",           dial: "211",  flag: "🇸🇸" },
  { code: "DJ", name: "Djibouti",              dial: "253",  flag: "🇩🇯" },
  { code: "EG", name: "Egypt",                 dial: "20",   flag: "🇪🇬" },
  { code: "NG", name: "Nigeria",               dial: "234",  flag: "🇳🇬" },
  { code: "GH", name: "Ghana",                 dial: "233",  flag: "🇬🇭" },
  { code: "ZA", name: "South Africa",          dial: "27",   flag: "🇿🇦" },
  { code: "US", name: "United States",         dial: "1",    flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom",        dial: "44",   flag: "🇬🇧" },
  { code: "CA", name: "Canada",                dial: "1",    flag: "🇨🇦" },
  { code: "AU", name: "Australia",             dial: "61",   flag: "🇦🇺" },
  { code: "DE", name: "Germany",               dial: "49",   flag: "🇩🇪" },
  { code: "FR", name: "France",                dial: "33",   flag: "🇫🇷" },
  { code: "IT", name: "Italy",                 dial: "39",   flag: "🇮🇹" },
  { code: "SE", name: "Sweden",                dial: "46",   flag: "🇸🇪" },
  { code: "NO", name: "Norway",                dial: "47",   flag: "🇳🇴" },
  { code: "NL", name: "Netherlands",           dial: "31",   flag: "🇳🇱" },
  { code: "SA", name: "Saudi Arabia",          dial: "966",  flag: "🇸🇦" },
  { code: "AE", name: "United Arab Emirates",  dial: "971",  flag: "🇦🇪" },
  { code: "IN", name: "India",                 dial: "91",   flag: "🇮🇳" },
  { code: "CN", name: "China",                 dial: "86",   flag: "🇨🇳" },
  { code: "JP", name: "Japan",                 dial: "81",   flag: "🇯🇵" },
  { code: "BR", name: "Brazil",                dial: "55",   flag: "🇧🇷" },
  { code: "RU", name: "Russia",                dial: "7",    flag: "🇷🇺" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findCountryByDial(value: string): CountryCode {
  if (!value) return COUNTRIES[0];
  // Strip leading +
  const digits = value.startsWith("+") ? value.slice(1) : value;
  // Try longest-match first (e.g. "291" before "29")
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  return sorted.find((c) => digits.startsWith(c.dial)) ?? COUNTRIES[0];
}

function getLocalNumber(value: string, dialCode: string): string {
  if (!value) return "";
  const digits = value.startsWith("+") ? value.slice(1) : value;
  if (digits.startsWith(dialCode)) return digits.slice(dialCode.length);
  return digits;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PhoneInputProps {
  /** Full phone number including dial code, e.g. "+2519XXXXXXXX" */
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
  className?: string;
}

// ─── Dropdown portal ──────────────────────────────────────────────────────────

interface DropdownProps {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  search: string;
  onSearch: (v: string) => void;
  selected: CountryCode;
  onSelect: (c: CountryCode) => void;
  onClose: () => void;
}

function CountryDropdown({ anchorRef, search, onSearch, selected, onSelect, onClose }: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  // Position
  const [style, setStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setStyle({
      position: "fixed",
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(r.width + 240, 280),
      zIndex: 9999,
    });
  }, [anchorRef]);

  // Close on outside click / Escape
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !anchorRef.current?.contains(t)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, anchorRef]);

  return ReactDOM.createPortal(
    <div
      ref={ref}
      style={style}
      className="rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden"
    >
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <Search className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        <input
          autoFocus
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search country..."
          className="flex-1 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
        />
        {search && (
          <button type="button" onClick={() => onSearch("")} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {/* List */}
      <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <li className="px-3 py-2 text-sm text-zinc-400">No countries found</li>
        )}
        {filtered.map((c) => (
          <li
            key={c.code}
            role="option"
            aria-selected={c.code === selected.code}
            onClick={() => { onSelect(c); onClose(); }}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors",
              c.code === selected.code
                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200"
            )}
          >
            <span className="text-base leading-none">{c.flag}</span>
            <span className="flex-1 truncate">{c.name}</span>
            <span className="text-zinc-400 font-mono text-xs shrink-0">+{c.dial}</span>
          </li>
        ))}
      </ul>
    </div>,
    document.body
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PhoneInput({
  value = "",
  onChange,
  onBlur,
  placeholder = "9XXXXXXXX",
  disabled,
  error,
  id,
  className,
}: PhoneInputProps) {
  const [country, setCountry]     = useState<CountryCode>(() => findCountryByDial(value));
  const [local, setLocal]         = useState<string>(() => getLocalNumber(value, findCountryByDial(value).dial));
  const [dropOpen, setDropOpen]   = useState(false);
  const [search, setSearch]       = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sync when parent changes value externally
  useEffect(() => {
    if (!value) return;
    const c = findCountryByDial(value);
    setCountry(c);
    setLocal(getLocalNumber(value, c.dial));
  }, [value]);

  const emit = useCallback((dialCode: string, localNum: string) => {
    const clean = localNum.replace(/\D/g, "");
    onChange?.(`+${dialCode}${clean}`);
  }, [onChange]);

  const handleCountrySelect = (c: CountryCode) => {
    setCountry(c);
    setSearch("");
    emit(c.dial, local);
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s\-()]/g, "");
    setLocal(raw);
    emit(country.dial, raw);
  };

  return (
    <div className={cn("space-y-1", className)}>
      <div
        className={cn(
          "flex items-center rounded-lg border bg-white dark:bg-zinc-900 transition-colors overflow-hidden",
          error
            ? "border-red-400 dark:border-red-500 focus-within:ring-2 focus-within:ring-red-400/30"
            : "border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        {/* Country trigger */}
        <button
          ref={triggerRef}
          type="button"
          aria-label="Select country code"
          aria-haspopup="listbox"
          aria-expanded={dropOpen}
          disabled={disabled}
          onClick={() => { setDropOpen((v) => !v); setSearch(""); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2.5 border-r border-zinc-200 dark:border-zinc-800",
            "text-sm font-medium text-zinc-700 dark:text-zinc-300 shrink-0",
            "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors focus:outline-none"
          )}
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="font-mono text-xs text-zinc-500">+{country.dial}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-zinc-400 transition-transform", dropOpen && "rotate-180")} />
        </button>

        {/* Number input */}
        <input
          id={id}
          type="tel"
          value={local}
          onChange={handleLocalChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="tel-national"
          className={cn(
            "flex-1 px-3 py-2.5 text-sm bg-transparent outline-none",
            "text-zinc-900 dark:text-zinc-100 placeholder-zinc-400",
            "min-w-0"
          )}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Dropdown portal */}
      {dropOpen && (
        <CountryDropdown
          anchorRef={triggerRef}
          search={search}
          onSearch={setSearch}
          selected={country}
          onSelect={handleCountrySelect}
          onClose={() => setDropOpen(false)}
        />
      )}
    </div>
  );
}
