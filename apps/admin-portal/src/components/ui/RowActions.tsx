"use client";

/**
 * RowActions — reusable action button group for cards, table rows, and detail pages.
 *
 * Permission resolution:
 *   Each action accepts either:
 *   - `permission`  — a codeName string (e.g. "member_change"). Resolved via useAuth internally.
 *   - `permissions` — array of codeNames. Action is visible if the user has ANY of them.
 *   - `allowed`     — explicit boolean override (still works for computed values).
 *
 *   Resolution order per action:
 *     1. If `allowed` is explicitly set to false → hidden (hard veto)
 *     2. If `permission` or `permissions` is set → check via hasPermission
 *     3. If none set → visible (public action)
 *
 * Display modes:
 *   "bar"  — icon row (default, good for cards/rows)
 *   "menu" — ⋯ dropdown via portal (good for dense tables — no clipping)
 */

import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Pencil,
  Trash2,
  Eye,
  Download,
  RotateCcw,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionVariant = "default" | "destructive" | "warning" | "success";

export interface Action {
  /** Unique key used as React key */
  key: string;
  /** Tooltip (bar mode) and menu item label */
  label: string;
  /** Lucide icon */
  icon: LucideIcon;
  /** Called on click. May be async. */
  onClick: () => void | Promise<void>;

  // ── Permission gates (any one of these can gate visibility) ──────────────
  /**
   * A single permission codeName required to show this action.
   * e.g. "member_change"
   */
  permission?: string;
  /**
   * Multiple permission codeNames — visible if the user has ANY of them.
   * e.g. ["member_change", "member_edit"]
   */
  permissions?: string[];
  /**
   * Explicit boolean override.
   * false → always hidden regardless of permission strings.
   * true  → always visible regardless of permission strings.
   * Omit  → rely solely on permission/permissions.
   */
  allowed?: boolean;

  // ── UX ────────────────────────────────────────────────────────────────────
  /** Visual emphasis */
  variant?: ActionVariant;
  /** Show spinner and disable */
  loading?: boolean;
  /** Disable without spinner */
  disabled?: boolean;
  /** Browser confirm() before onClick */
  confirm?: string;
}

export interface RowActionsProps {
  actions: Action[];
  /**
   * "bar"  — icon buttons in a row (default)
   * "menu" — single ⋯ trigger with dropdown portal
   */
  mode?: "bar" | "menu";
  /** Bar mode: show label text next to icons */
  showLabels?: boolean;
  className?: string;
}

// ─── Preset factories ─────────────────────────────────────────────────────────

/**
 * Pre-built action factories. Pass your handler and optional permission.
 *
 * @example
 * presets.edit({ onClick: () => setOpen(true), permission: "member_change" })
 * presets.delete({ onClick: handleDelete, permissions: ["member_delete", "member_change"], confirm: "Delete?" })
 */
export const presets = {
  view: (overrides: Partial<Action> & Pick<Action, "onClick">): Action => ({
    key: "view", label: "View", icon: Eye, variant: "default", ...overrides,
  }),
  edit: (overrides: Partial<Action> & Pick<Action, "onClick">): Action => ({
    key: "edit", label: "Edit", icon: Pencil, variant: "default", ...overrides,
  }),
  delete: (overrides: Partial<Action> & Pick<Action, "onClick">): Action => ({
    key: "delete", label: "Delete", icon: Trash2, variant: "destructive",
    confirm: "Are you sure you want to delete this item?", ...overrides,
  }),
  download: (overrides: Partial<Action> & Pick<Action, "onClick">): Action => ({
    key: "download", label: "Download", icon: Download, variant: "default", ...overrides,
  }),
  restore: (overrides: Partial<Action> & Pick<Action, "onClick">): Action => ({
    key: "restore", label: "Restore", icon: RotateCcw, variant: "success", ...overrides,
  }),
};

// ─── Colour maps ──────────────────────────────────────────────────────────────

const barColors: Record<ActionVariant, string> = {
  default:     "text-zinc-400 hover:text-blue-600   hover:bg-blue-50   dark:hover:bg-blue-950/30",
  destructive: "text-zinc-400 hover:text-red-600    hover:bg-red-50    dark:hover:bg-red-950/30",
  warning:     "text-zinc-400 hover:text-amber-600  hover:bg-amber-50  dark:hover:bg-amber-950/30",
  success:     "text-zinc-400 hover:text-green-600  hover:bg-green-50  dark:hover:bg-green-950/30",
};

const menuColors: Record<ActionVariant, string> = {
  default:     "text-zinc-700 dark:text-zinc-300",
  destructive: "text-red-600  dark:text-red-400",
  warning:     "text-amber-600 dark:text-amber-400",
  success:     "text-green-600 dark:text-green-400",
};

// ─── Permission resolver hook ─────────────────────────────────────────────────

function useVisibleActions(actions: Action[]): Action[] {
  const { hasPermission } = useAuth();

  return actions.filter((a) => {
    // Hard veto — explicit false wins over everything
    if (a.allowed === false) return false;

    // Explicit true — skip permission check entirely
    if (a.allowed === true) return true;

    // Check named permissions
    if (a.permission) return hasPermission(a.permission);
    if (a.permissions && a.permissions.length > 0) {
      return a.permissions.some((p) => hasPermission(p));
    }

    // No gate defined → always show
    return true;
  });
}

// ─── Single action button (bar mode) ─────────────────────────────────────────

function BarButton({ action, showLabels }: { action: Action; showLabels: boolean }) {
  const [loading, setLoading] = useState(false);
  const Icon = action.icon;
  const isLoading  = action.loading || loading;
  const isDisabled = action.disabled || isLoading;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (action.confirm && !window.confirm(action.confirm)) return;
    const result = action.onClick();
    if (result instanceof Promise) {
      setLoading(true);
      try { await result; } finally { setLoading(false); }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={action.label}
      title={action.label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg p-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "disabled:pointer-events-none disabled:opacity-40",
        barColors[action.variant ?? "default"]
      )}
    >
      {isLoading
        ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
        : <Icon className="h-4 w-4" aria-hidden="true" />
      }
      {showLabels && <span>{action.label}</span>}
    </button>
  );
}

// ─── Dropdown menu (menu mode) — portal-based, no clipping ───────────────────

function MenuActions({ actions }: { actions: Action[] }) {
  const [open, setOpen]         = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [menuStyle, setMenuStyle]   = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef    = useRef<HTMLDivElement>(null);

  const positionMenu = () => {
    if (!triggerRef.current) return;
    const rect         = triggerRef.current.getBoundingClientRect();
    const menuHeight   = actions.length * 40 + 16;
    const spaceBelow   = window.innerHeight - rect.bottom;
    const openUpward   = spaceBelow < menuHeight + 8 && rect.top > menuHeight + 8;

    setMenuStyle({
      position: "fixed",
      right:    window.innerWidth - rect.right,
      top:      openUpward ? rect.top - menuHeight - 4 : rect.bottom + 4,
      minWidth: 176,
      zIndex:   9999,
    });
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    positionMenu();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey    = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const handleItemClick = async (action: Action, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    if (action.confirm && !window.confirm(action.confirm)) return;
    const result = action.onClick();
    if (result instanceof Promise) {
      setLoadingKey(action.key);
      try { await result; } finally { setLoadingKey(null); }
    }
  };

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      style={menuStyle}
      className={cn(
        "rounded-xl border border-zinc-200 bg-white shadow-xl py-1",
        "dark:border-zinc-800 dark:bg-zinc-900",
        "animate-in fade-in slide-in-from-top-2 duration-150"
      )}
    >
      {actions.map((action) => {
        const Icon       = action.icon;
        const isLoading  = action.loading || loadingKey === action.key;
        const isDisabled = action.disabled || isLoading;
        return (
          <button
            key={action.key}
            type="button"
            role="menuitem"
            disabled={isDisabled}
            onClick={(e) => handleItemClick(action, e)}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
              "disabled:pointer-events-none disabled:opacity-40",
              menuColors[action.variant ?? "default"]
            )}
          >
            {isLoading
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" aria-hidden="true" />
              : <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            }
            {action.label}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleOpen}
        className={cn(
          "inline-flex items-center justify-center rounded-lg p-1.5 transition-colors",
          "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        )}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>
      {typeof window !== "undefined" && menu
        ? ReactDOM.createPortal(menu, document.body)
        : null}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RowActions({
  actions,
  mode = "bar",
  showLabels = false,
  className,
}: RowActionsProps) {
  const visible = useVisibleActions(actions);
  if (visible.length === 0) return null;

  if (mode === "menu") return <MenuActions actions={visible} />;

  return (
    <div
      role="group"
      aria-label="Row actions"
      className={cn("flex items-center gap-0.5", className)}
    >
      {visible.map((action) => (
        <BarButton key={action.key} action={action} showLabels={showLabels} />
      ))}
    </div>
  );
}
