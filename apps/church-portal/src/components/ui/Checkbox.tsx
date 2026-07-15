import * as React from "react";
import { cn } from "../../lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-zinc-300 bg-white accent-blue-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900",
          className
        )}
        {...props}
      />
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
          {label}
        </label>
      )}
    </div>
  )
);
Checkbox.displayName = "Checkbox";
