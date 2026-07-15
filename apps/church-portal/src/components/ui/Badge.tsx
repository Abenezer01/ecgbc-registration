import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "danger" | "info" | "outline";
}

const variantStyles: Record<string, string> = {
  default:   "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  secondary: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  success:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400",
  warning:   "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400",
  danger:    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  info:      "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  outline:   "border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
};

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
