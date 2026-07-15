"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, X, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: string;
  maxHeight?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  disabled = false,
  error,
  maxHeight = "300px",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "w-full min-h-[40px] px-3 py-2 text-left border rounded-lg",
          "bg-white dark:bg-zinc-900",
          "border-zinc-200 dark:border-zinc-800",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
          "transition-all duration-200",
          disabled && "opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900",
          error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
          "flex items-center gap-2 flex-wrap"
        )}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-zinc-400 dark:text-zinc-500">{placeholder}</span>
        ) : (
          <>
            {selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm"
              >
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => removeOption(opt.value, e)}
                  className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {selectedOptions.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="ml-auto text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-zinc-400 ml-auto transition-transform",
            open && "transform rotate-180"
          )}
        />
      </button>

      {/* Error */}
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute z-50 w-full mt-1 rounded-lg border shadow-lg",
            "bg-white dark:bg-zinc-900",
            "border-zinc-200 dark:border-zinc-800"
          )}
          style={{ maxHeight }}
        >
          {/* Search */}
          <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  "w-full pl-9 pr-3 py-2 text-sm rounded-md border",
                  "bg-zinc-50 dark:bg-zinc-800",
                  "border-zinc-200 dark:border-zinc-700",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                  "placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                )}
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-[240px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-400">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md",
                      "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      "transition-colors duration-150",
                      isSelected && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-4 h-4 rounded border",
                        isSelected
                          ? "bg-blue-600 border-blue-600"
                          : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="flex-1 text-left text-zinc-900 dark:text-white">
                      {option.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
