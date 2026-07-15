import React from "react";
import { DollarSign, Clock, TrendingUp } from "lucide-react";
import { FinanceSummary } from "../../hooks/useFinance";

interface FinanceSummaryCardsProps {
  summary: FinanceSummary;
  isLoading: boolean;
}

export function FinanceSummaryCards({
  summary,
  isLoading,
}: FinanceSummaryCardsProps) {
  const cards = [
    {
      label: "Total Collected",
      value: summary?.totalCollected || 0,
      count: summary?.paidCount || 0,
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Sent / Awaiting Payment",
      value: summary?.sentAmount || 0,
      count: summary?.sentCount || 0,
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Pending to Send",
      value: summary?.pendingAmount || 0,
      count: summary?.pendingCount || 0,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4"
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.bg}`}
          >
            <card.icon className={`h-6 w-6 ${card.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {card.label}
            </p>
            {isLoading ? (
              <div className="h-7 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1" />
            ) : (
              <p className="text-2xl font-bold text-zinc-900 dark:text-white truncate mt-0.5">
                {summary?.currency || 'ETB'} {card.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            )}
            <p className="text-xs text-zinc-400 mt-1">
              From {card.count} fee{card.count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
