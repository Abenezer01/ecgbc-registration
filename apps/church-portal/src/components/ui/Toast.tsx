"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const iconMap: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

const borderMap: Record<ToastVariant, string> = {
  success: "border-l-4 border-emerald-500",
  error: "border-l-4 border-red-500",
  warning: "border-l-4 border-amber-500",
  info: "border-l-4 border-blue-500",
};

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 w-80">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "flex items-start gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0f0f11] p-4 shadow-lg",
              borderMap[t.variant]
            )}
          >
            <div className="mt-0.5 shrink-0">{iconMap[t.variant]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => onRemove(t.id)}
              className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
