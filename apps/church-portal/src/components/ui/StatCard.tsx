import * as React from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent } from "./Card";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  description?: string;
  className?: string;
}

/**
 * StatCard renders a KPI metric tile used in analytics dashboards.
 *
 * Usage:
 *   <StatCard title="Total Members" value={1240} icon={<Users />} trend={{ value: "+12%", positive: true }} />
 */
export function StatCard({ title, value, icon, trend, description, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {value}
            </p>
          </div>
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              {icon}
            </div>
          )}
        </div>
        {(trend || description) && (
          <div className="mt-4 flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  trend.positive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                )}
              >
                {trend.positive ? "↑" : "↓"} {trend.value}
              </span>
            )}
            {description && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
