"use client";

import React from "react";
import { Users, Globe, MapPin, Clock, Building2 } from "lucide-react";
import type { MembersFilters } from "@/hooks/useMembers";
import type { MemberStats } from "@/hooks/useMemberStats";

interface MembersStatCardsProps {
  filters: MembersFilters;
  stats: MemberStats | undefined;
  isLoading: boolean;
  onFilterChange: (next: MembersFilters) => void;
}

// ─── Palette cycling for institution-type cards ──────────────────────────────
const TYPE_PALETTES = [
  {
    accent: "bg-violet-600 dark:bg-violet-500",
    iconIdle: "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400",
    borderActive: "border-violet-500 dark:border-violet-400",
    ring: "ring-violet-500/20",
  },
  {
    accent: "bg-rose-600 dark:bg-rose-500",
    iconIdle: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400",
    borderActive: "border-rose-500 dark:border-rose-400",
    ring: "ring-rose-500/20",
  },
  {
    accent: "bg-cyan-600 dark:bg-cyan-500",
    iconIdle: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400",
    borderActive: "border-cyan-500 dark:border-cyan-400",
    ring: "ring-cyan-500/20",
  },
  {
    accent: "bg-orange-500 dark:bg-orange-400",
    iconIdle: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400",
    borderActive: "border-orange-500 dark:border-orange-400",
    ring: "ring-orange-500/20",
  },
  {
    accent: "bg-teal-600 dark:bg-teal-500",
    iconIdle: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400",
    borderActive: "border-teal-500 dark:border-teal-400",
    ring: "ring-teal-500/20",
  },
  {
    accent: "bg-fuchsia-600 dark:bg-fuchsia-500",
    iconIdle: "bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400",
    borderActive: "border-fuchsia-500 dark:border-fuchsia-400",
    ring: "ring-fuchsia-500/20",
  },
];

export function MembersStatCards({
  filters,
  stats,
  isLoading,
  onFilterChange,
}: MembersStatCardsProps) {
  const noLocationFilter = !filters.isInEthiopia || filters.isInEthiopia === "all";

  return (
    <div className="space-y-3">
      {/* ── Row 1: Location breakdown ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Members"
          sublabel="All matching records"
          icon={<Users className="h-5 w-5" />}
          value={stats?.total}
          isActive={noLocationFilter}
          clickable
          onClick={() => onFilterChange({ ...filters, isInEthiopia: "all", page: 1 })}
          accentClass="bg-zinc-800 dark:bg-zinc-200"
          iconIdleClass="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          borderActiveClass="border-zinc-800 dark:border-zinc-300"
          ringClass="ring-zinc-800/10 dark:ring-zinc-200/10"
          isLoading={isLoading}
        />
        <StatCard
          label="In Ethiopia"
          sublabel="Domestic institutions"
          icon={<MapPin className="h-5 w-5" />}
          value={stats?.inEthiopia}
          isActive={filters.isInEthiopia === "yes"}
          clickable
          onClick={() => onFilterChange({ ...filters, isInEthiopia: "yes", page: 1 })}
          accentClass="bg-emerald-600 dark:bg-emerald-500"
          iconIdleClass="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
          borderActiveClass="border-emerald-500 dark:border-emerald-400"
          ringClass="ring-emerald-500/20"
          isLoading={isLoading}
        />
        <StatCard
          label="Abroad"
          sublabel="International institutions"
          icon={<Globe className="h-5 w-5" />}
          value={stats?.abroad}
          isActive={filters.isInEthiopia === "no"}
          clickable
          onClick={() => onFilterChange({ ...filters, isInEthiopia: "no", page: 1 })}
          accentClass="bg-blue-600 dark:bg-blue-500"
          iconIdleClass="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
          borderActiveClass="border-blue-500 dark:border-blue-400"
          ringClass="ring-blue-500/20"
          isLoading={isLoading}
        />
        <StatCard
          label="Inactive"
          sublabel="Deactivated records"
          icon={<Clock className="h-5 w-5" />}
          value={stats?.inactive}
          isActive={false}
          clickable={false}
          onClick={() => {}}
          accentClass="bg-amber-500 dark:bg-amber-400"
          iconIdleClass="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
          borderActiveClass="border-amber-500"
          ringClass="ring-amber-500/20"
          isLoading={isLoading}
        />
      </div>

      {/* ── Row 2: Institution type breakdown ─────────────────────────── */}
      {(isLoading || (stats?.byType && stats.byType.length > 0)) && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2 pl-0.5">
            By Institution Type
          </p>
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(160px, 1fr))`,
            }}
          >
            {isLoading && !stats
              ? // Skeleton placeholders
                Array.from({ length: 4 }).map((_, i) => (
                  <TypeCardSkeleton key={i} />
                ))
              : stats?.byType.map((t, i) => {
                  const palette = TYPE_PALETTES[i % TYPE_PALETTES.length];
                  const isActive = filters.typeId === t.id;
                  return (
                    <StatCard
                      key={t.id}
                      label={t.description}
                      sublabel="Institution type"
                      icon={<Building2 className="h-4 w-4" />}
                      value={t.count}
                      isActive={isActive}
                      clickable
                      onClick={() =>
                        onFilterChange({
                          ...filters,
                          typeId: isActive ? "all" : t.id,
                          page: 1,
                        })
                      }
                      accentClass={palette.accent}
                      iconIdleClass={palette.iconIdle}
                      borderActiveClass={palette.borderActive}
                      ringClass={palette.ring}
                      isLoading={isLoading}
                      compact
                    />
                  );
                })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared card component ────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  value: number | undefined;
  isActive: boolean;
  clickable: boolean;
  onClick: () => void;
  accentClass: string;
  iconIdleClass: string;
  borderActiveClass: string;
  ringClass: string;
  isLoading: boolean;
  compact?: boolean;
}

function StatCard({
  label,
  sublabel,
  icon,
  value,
  isActive,
  clickable,
  onClick,
  accentClass,
  iconIdleClass,
  borderActiveClass,
  ringClass,
  isLoading,
  compact = false,
}: StatCardProps) {
  const Tag = clickable ? "button" : "div";

  return (
    <Tag
      {...(clickable ? { type: "button" as const, onClick } : {})}
      className={[
        "relative overflow-hidden text-left rounded-xl border bg-white dark:bg-zinc-900",
        "transition-all duration-200 shadow-sm w-full group",
        clickable
          ? `cursor-pointer hover:shadow-md focus:outline-none focus-visible:ring-2 ${ringClass}`
          : "cursor-default",
        isActive
          ? `${borderActiveClass} shadow-md ring-2 ${ringClass}`
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
      ].join(" ")}
    >
      {/* Top accent bar */}
      <span
        className={[
          "absolute inset-x-0 top-0 h-1 transition-opacity duration-200",
          accentClass,
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50",
        ].join(" ")}
      />

      <div className={compact ? "p-3 pt-4" : "p-4 pt-5"}>
        {/* Icon */}
        <div className={compact ? "mb-2" : "mb-3"}>
          <span
            className={[
              "inline-flex items-center justify-center rounded-lg transition-colors duration-150",
              compact ? "p-1.5" : "p-2",
              isActive ? `${accentClass} text-white` : iconIdleClass,
            ].join(" ")}
          >
            {icon}
          </span>
        </div>

        {/* Value */}
        {isLoading || value === undefined ? (
          <div
            className={[
              "bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse mb-1",
              compact ? "h-6 w-12" : "h-8 w-20",
            ].join(" ")}
          />
        ) : (
          <p
            className={[
              "font-bold text-zinc-900 dark:text-white tabular-nums leading-none mb-1",
              compact ? "text-xl" : "text-2xl",
            ].join(" ")}
          >
            {value.toLocaleString()}
          </p>
        )}

        <p className={["font-semibold text-zinc-700 dark:text-zinc-200", compact ? "text-[11px]" : "text-xs"].join(" ")}>
          {label}
        </p>
        {!compact && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-tight">
            {sublabel}
          </p>
        )}

        {/* Active pill */}
        {isActive && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Filtered
          </span>
        )}
      </div>
    </Tag>
  );
}

function TypeCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 pt-4 shadow-sm">
      <span className="absolute inset-x-0 top-0 h-1 bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
      <div className="h-7 w-7 rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse mb-2" />
      <div className="h-6 w-12 rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse mb-1" />
      <div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
    </div>
  );
}
