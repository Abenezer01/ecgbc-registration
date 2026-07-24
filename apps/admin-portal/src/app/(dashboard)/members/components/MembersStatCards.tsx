"use client";

import React from "react";
import { Users, Globe, MapPin, Clock } from "lucide-react";
import type { MembersFilters } from "@/hooks/useMembers";
import type { MemberStats } from "@/hooks/useMemberStats";

interface StatCardDef {
  key: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  value: number | undefined;
  /** Whether this card's filter is currently active */
  isActive: boolean;
  /** Whether clicking this card applies a filter (false = info-only) */
  clickable: boolean;
  onClick: () => void;
  accentClass: string;        // bg- class for the top bar / icon active bg
  iconIdleClass: string;      // text-/bg- classes when not active
  borderActiveClass: string;
  ringClass: string;
}

interface MembersStatCardsProps {
  filters: MembersFilters;
  stats: MemberStats | undefined;
  isLoading: boolean;
  onFilterChange: (next: MembersFilters) => void;
}

export function MembersStatCards({
  filters,
  stats,
  isLoading,
  onFilterChange,
}: MembersStatCardsProps) {
  const noLocationFilter = !filters.isInEthiopia || filters.isInEthiopia === "all";

  const cards: StatCardDef[] = [
    {
      key: "total",
      label: "Total Members",
      sublabel: "All matching records",
      icon: <Users className="h-5 w-5" />,
      value: stats?.total,
      isActive: noLocationFilter,
      clickable: true,
      onClick: () => onFilterChange({ ...filters, isInEthiopia: "all", page: 1 }),
      accentClass: "bg-zinc-800 dark:bg-zinc-200",
      iconIdleClass: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300",
      borderActiveClass: "border-zinc-800 dark:border-zinc-300",
      ringClass: "ring-zinc-800/10 dark:ring-zinc-200/10",
    },
    {
      key: "ethiopia",
      label: "In Ethiopia",
      sublabel: "Domestic institutions",
      icon: <MapPin className="h-5 w-5" />,
      value: stats?.inEthiopia,
      isActive: filters.isInEthiopia === "yes",
      clickable: true,
      onClick: () => onFilterChange({ ...filters, isInEthiopia: "yes", page: 1 }),
      accentClass: "bg-emerald-600 dark:bg-emerald-500",
      iconIdleClass: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
      borderActiveClass: "border-emerald-500 dark:border-emerald-400",
      ringClass: "ring-emerald-500/20",
    },
    {
      key: "abroad",
      label: "Abroad",
      sublabel: "International institutions",
      icon: <Globe className="h-5 w-5" />,
      value: stats?.abroad,
      isActive: filters.isInEthiopia === "no",
      clickable: true,
      onClick: () => onFilterChange({ ...filters, isInEthiopia: "no", page: 1 }),
      accentClass: "bg-blue-600 dark:bg-blue-500",
      iconIdleClass: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
      borderActiveClass: "border-blue-500 dark:border-blue-400",
      ringClass: "ring-blue-500/20",
    },
    {
      key: "inactive",
      label: "Inactive",
      sublabel: "Deactivated records",
      icon: <Clock className="h-5 w-5" />,
      value: stats?.inactive,
      isActive: false,
      clickable: false,
      onClick: () => {},
      accentClass: "bg-amber-500 dark:bg-amber-400",
      iconIdleClass: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
      borderActiveClass: "border-amber-500",
      ringClass: "ring-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => (
        <StatCard key={card.key} card={card} isLoading={isLoading} />
      ))}
    </div>
  );
}

function StatCard({ card, isLoading }: { card: StatCardDef; isLoading: boolean }) {
  const Tag = card.clickable ? "button" : "div";

  return (
    <Tag
      {...(card.clickable
        ? { type: "button" as const, onClick: card.onClick }
        : {})}
      className={[
        "relative overflow-hidden text-left rounded-xl border bg-white dark:bg-zinc-900",
        "transition-all duration-200 shadow-sm w-full",
        card.clickable
          ? "cursor-pointer hover:shadow-md focus:outline-none focus-visible:ring-2 " + card.ringClass
          : "cursor-default",
        card.isActive
          ? `${card.borderActiveClass} shadow-md ring-2 ${card.ringClass}`
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
      ].join(" ")}
    >
      {/* Coloured accent bar */}
      <span
        className={[
          "absolute inset-x-0 top-0 h-1 transition-opacity duration-200",
          card.accentClass,
          card.isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40",
        ].join(" ")}
      />

      <div className="p-4 pt-5">
        {/* Icon */}
        <div className="mb-3">
          <span
            className={[
              "inline-flex items-center justify-center p-2 rounded-lg transition-colors duration-150",
              card.isActive
                ? `${card.accentClass} text-white`
                : card.iconIdleClass,
            ].join(" ")}
          >
            {card.icon}
          </span>
        </div>

        {/* Value */}
        {isLoading || card.value === undefined ? (
          <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse mb-2" />
        ) : (
          <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums leading-none mb-1">
            {card.value.toLocaleString()}
          </p>
        )}

        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          {card.label}
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-tight">
          {card.sublabel}
        </p>

        {/* Active pill */}
        {card.isActive && (
          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Filtered
          </span>
        )}
      </div>
    </Tag>
  );
}
