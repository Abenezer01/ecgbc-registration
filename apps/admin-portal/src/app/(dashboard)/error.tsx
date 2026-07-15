"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * error.tsx — catches unhandled errors inside any (dashboard) page.
 * Must be a Client Component.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
        <AlertTriangle className="h-7 w-7 text-red-500 dark:text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
        Something went wrong
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <Button onClick={reset} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
