"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { TableRowSkeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { FileSearch } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  skeletonRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
}

/**
 * DataTable is a fully generic, reusable table that accepts a column definition
 * and row data — used everywhere across the admin portal.
 *
 * Usage:
 *   <DataTable
 *     columns={[
 *       { key: "name", header: "Name", cell: (row) => row.name },
 *       { key: "status", header: "Status", cell: (row) => <Badge>{row.status}</Badge> },
 *     ]}
 *     data={members}
 *     rowKey={(row) => row.id}
 *     isLoading={isLoading}
 *   />
 */
export function DataTable<T>({
  columns,
  data,
  isLoading,
  skeletonRows = 5,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your filters or search criteria.",
  className,
  rowKey,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-[#0f0f11]">
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRowSkeleton key={i} cols={columns.length} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={<FileSearch className="h-6 w-6" />}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3 text-zinc-700 dark:text-zinc-300", col.className)}
                    >
                      {col.cell(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
