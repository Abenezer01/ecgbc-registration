"use client";

import React, { useState, useEffect } from "react";
import { Search, Building2, Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui";
import api from "@/lib/api";

export interface MemberOption {
  id: string;
  name: string;
  nameEn?: string;
  certificateNo: string;
  city?: string;
  isActive: boolean;
  councilFellowshipId?: string;
  regionId?: string;
  councilFellowship?: { id: string; name: string };
  region?: { id: string; description: string; value: string };
  subcity?: string;
  zone?: string;
  district?: string;
  houseNumber?: string;
}

interface ChurchSearchPickerProps {
  selectedChurch: MemberOption | null;
  onSelectChurch: (church: MemberOption | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: string[];
  required?: boolean;
}

export function ChurchSearchPicker({
  selectedChurch,
  onSelectChurch,
  label = "Select Church",
  placeholder = "Search church by name or certificate number...",
  disabled = false,
  excludeIds = [],
  required = false,
}: ChurchSearchPickerProps) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<MemberOption[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get("/members", {
          params: { search: query.trim(), pageSize: 8 },
        });
        const list = res.data?.data?.members || [];
        const filtered = list.filter((m: MemberOption) => !excludeIds.includes(m.id));
        setResults(filtered);
      } catch (err) {
        console.error("Church search error:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, excludeIds]);

  if (selectedChurch) {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-zinc-900 dark:text-white">
                  {selectedChurch.name}
                </span>
                <Badge variant={selectedChurch.isActive ? "success" : "danger"} className="text-[10px] px-1.5 py-0">
                  {selectedChurch.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                <span className="font-mono">{selectedChurch.certificateNo || "No Cert"}</span>
                {selectedChurch.councilFellowship?.name && (
                  <>
                    <span>•</span>
                    <span>{selectedChurch.councilFellowship.name}</span>
                  </>
                )}
                {selectedChurch.city && (
                  <>
                    <span>•</span>
                    <span>{selectedChurch.city}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={() => {
                onSelectChurch(null);
                setQuery("");
              }}
              className="text-xs px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors flex items-center gap-1"
            >
              <X size={12} /> Change
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 relative">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-8 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-zinc-400" />
        )}
      </div>

      {/* Dropdown Results */}
      {isFocused && query.trim().length >= 2 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl z-50 divide-y divide-zinc-100 dark:divide-zinc-800"
          onMouseDown={(e) => e.preventDefault()} // Keep focus
        >
          {searching ? (
            <div className="p-4 text-xs text-center text-zinc-400 flex items-center justify-center gap-1.5">
              <Loader2 className="animate-spin h-3.5 w-3.5" /> Searching churches...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-xs text-center text-zinc-400">
              No matching churches found
            </div>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelectChurch(c);
                  setIsFocused(false);
                  setQuery("");
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-xs text-zinc-900 dark:text-white group-hover:text-blue-600">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono">{c.certificateNo || "No Cert"}</span>
                    {c.councilFellowship?.name && <span>• {c.councilFellowship.name}</span>}
                    {c.city && <span>• {c.city}</span>}
                  </div>
                </div>
                <Badge variant={c.isActive ? "success" : "danger"} className="text-[10px] px-1.5 py-0">
                  {c.isActive ? "Active" : "Inactive"}
                </Badge>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
