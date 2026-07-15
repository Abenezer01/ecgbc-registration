"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { TableRowSkeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { FileSearch } from "lucide-react";
import { Checkbox } from "@/components/ui";

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
  /** Enable row selection with checkboxes */
  selectable?: boolean;
  /** Currently selected row IDs (must match the type returned by rowKey) */
  selectedIds?: (string | number)[];
  /** Callback when selection changes */
  onSelectionChange?: (ids: (string | number)[]) => void;
}

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
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: DataTableProps<T>) {
  // Helper to get all IDs from data
  const allIds = data.map(rowKey);
  const isAllSelected =
    selectable &&
    selectedIds.length > 0 &&
    selectedIds.length === data.length &&
    data.every((row, i) => selectedIds.includes(rowKey(row)));

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    const newSelection = isAllSelected ? [] : allIds;
    onSelectionChange(newSelection);
  };

  const toggleRowSelection = (id: string | number) => {
    if (!onSelectionChange) return;
    const isSelected = selectedIds.includes(id);
    const newSelection = isSelected
      ? selectedIds.filter((pid) => pid !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelection);
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              {selectable && (
                <th className={cn("px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap")}>
                  <Checkbox
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
              )}
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
                <TableRowSkeleton key={i} cols={selectable ? columns.length + 1 : columns.length} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={selectable ? columns.length + 1 : columns.length}>
                  <EmptyState
                    icon={<FileSearch className="h-6 w-6" />}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const rowId = rowKey(row);
                const isSelected = selectedIds.includes(rowId);
                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {selectable && (
                      <td className={cn("px-4 py-3 text-left")}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleRowSelection(rowId)}
                          aria-label={`Select row ${rowId}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn("px-4 py-3 text-zinc-700 dark:text-zinc-300", col.className)}
                      >
                        {col.cell(row, i)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}