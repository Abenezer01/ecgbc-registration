"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Pagination renders a previous / page-numbers / next control bar.
 *
 * Usage:
 *   <Pagination page={page} pageSize={20} total={250} onPageChange={setPage} />
 */
export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className={cn("flex items-center justify-between gap-4 text-sm", className)}>
      <p className="text-zinc-500 dark:text-zinc-400">
        Page <span className="font-medium text-zinc-900 dark:text-white">{page}</span> of{" "}
        <span className="font-medium text-zinc-900 dark:text-white">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-zinc-400 select-none">…</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(p as number)}
              aria-label={`Go to page ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
