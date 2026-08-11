import * as React from "react";
import { cn } from "../../lib/utils";
import { formatEthiopianDate } from "../../lib/dateUtils";
import { Input, InputProps } from "./Input";

export interface DateInputProps extends Omit<InputProps, "type"> {
  wrapperClassName?: string;
  inputClassName?: string;
  previewClassName?: string;
  showPreview?: boolean;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      wrapperClassName,
      inputClassName,
      previewClassName,
      showPreview = true,
      value,
      ...props
    },
    ref
  ) => {
    const dateString = value ? String(value) : "";
    const ethiopianDate = showPreview && dateString ? formatEthiopianDate(dateString) : "";

    return (
      <div className={cn("flex items-center gap-3", wrapperClassName)}>
        <Input
          ref={ref}
          type="date"
          value={value}
          className={cn("flex-1", inputClassName)}
          {...props}
        />
        {ethiopianDate ? (
          <span
            className={cn(
              "text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 px-2 py-1.5 rounded-lg whitespace-nowrap",
              previewClassName
            )}
          >
            🗓 {ethiopianDate}
          </span>
        ) : null}
      </div>
    );
  }
);
DateInput.displayName = "DateInput";

export { DateInput };
export type { DateInputProps };
