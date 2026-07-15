import * as React from "react";
import { cn } from "../../lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Actions slot — renders buttons or controls top-right */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader renders a consistent top-of-page heading row across all pages.
 *
 * Usage:
 *   <PageHeader
 *     title="Members"
 *     description="Manage all registered members"
 *     actions={<Button>Add Member</Button>}
 *   />
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 mt-2 sm:mt-0">{actions}</div>}
    </div>
  );
}
