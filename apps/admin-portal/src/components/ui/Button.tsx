"use client";

import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: any;
  variant?: "default" | "primary" | "destructive" | "danger" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  /** When true, renders children directly (e.g. wrapping a Next.js <Link>) */
  asChild?: boolean;
  loading?: boolean;
}

const variantStyles: Record<string, string> = {
  default:     "bg-blue-600 text-white hover:bg-blue-700 shadow shadow-blue-500/20",
  primary:     "bg-blue-600 text-white hover:bg-blue-700 shadow shadow-blue-500/20",
  destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
  danger:      "bg-red-500 text-white hover:bg-red-600 shadow-sm",
  outline:     "border border-zinc-200 bg-transparent hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-100",
  secondary:   "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700",
  ghost:       "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
  link:        "text-blue-600 underline-offset-4 hover:underline dark:text-blue-500 p-0 shadow-none",
};

const sizeStyles: Record<string, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm:      "h-9 rounded-md px-3 text-xs",
  lg:      "h-11 rounded-md px-8 text-sm",
  icon:    "h-10 w-10 p-0",
};

const BASE =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, children, loading = false, disabled, ...props }, ref) => {
    const classes = cn(BASE, variantStyles[variant], sizeStyles[size], className);
    const isDisabled = disabled || loading;

    // When asChild, clone the single child element and merge classes
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(classes, (children as React.ReactElement<{ className?: string }>).props.className),
      });
    }

    return (
      <button
        className={classes}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
