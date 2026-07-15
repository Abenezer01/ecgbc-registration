import { StatCardSkeleton } from "@/components/ui";

/**
 * Dashboard-level loading.tsx — shown by Next.js while any page in
 * the (dashboard) route group is streaming in.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-72 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Chart placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
        <div className="h-72 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
      </div>

      {/* Full-width chart */}
      <div className="h-64 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
    </div>
  );
}
