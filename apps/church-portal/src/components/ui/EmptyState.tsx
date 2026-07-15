import * as React from "react";
import { cn } from "../../lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-8 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
