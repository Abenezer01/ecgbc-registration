"use client";

import React, { useEffect, type HTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Rendered in a sticky footer strip outside the scrollable body */
  footer?: React.ReactNode;
  className?: string;
  /**
   * Width of the drawer panel.
   * Defaults to "lg" (max-w-2xl).
   */
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const sizeMap: Record<NonNullable<DrawerProps["size"]>, string> = {
  sm:  "w-full max-w-sm",
  md:  "w-full max-w-lg",
  lg:  "w-full max-w-2xl",
  xl:  "w-full max-w-4xl",
  "2xl": "w-full max-w-3xl",
};

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  size = "lg",
}: DrawerProps) {
  // Escape key closes the drawer
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop — intentionally does NOT call onClose on click */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={cn(
              "relative z-10 flex flex-col h-full border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-[#0f0f11]",
              sizeMap[size],
              className
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 px-6 py-5 shrink-0">
              <div className="min-w-0">
                {title && (
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white leading-snug">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {children}
            </div>

            {/* Sticky footer */}
            {footer && (
              <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800 px-6 py-4 bg-white dark:bg-[#0f0f11] flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Convenience sticky footer inside a Drawer */
export function DrawerFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 px-6 py-4 bg-white dark:bg-[#0f0f11]",
        className
      )}
      {...props}
    />
  );
}
