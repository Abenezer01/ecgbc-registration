import * as React from "react";
import { cn } from "../../lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" };

export function Avatar({ src, alt, fallback, size = "md", className, ...props }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full overflow-hidden bg-blue-100 text-blue-700 font-semibold dark:bg-blue-500/20 dark:text-blue-400 select-none",
        sizes[size],
        className
      )}
      {...props}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt || "avatar"}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="uppercase">{fallback?.slice(0, 2) ?? "?"}</span>
      )}
    </div>
  );
}
