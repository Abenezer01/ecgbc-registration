import { cn } from "../../lib/utils";
import { Skeleton } from "./Skeleton";

interface CardSkeletonProps {
  /** Optional title skeleton width (default full width) */
  titleWidth?: string | number;
  /** Optional content height (default 8rem) */
  contentHeight?: string | number;
  /** Optional className for the card container */
  className?: string;
}

export function CardSkeleton({
  titleWidth = "w-full",
  contentHeight = "h-32",
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0f0f11] p-6",
        className
      )}
    >
      <div className="mb-4">
        <Skeleton className={`h-4 w-32 ${typeof titleWidth === "string" ? titleWidth : `w-${titleWidth}`}`} />
      </div>
      <div className={typeof contentHeight === "string" ? contentHeight : `h-${contentHeight}`}>
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
}