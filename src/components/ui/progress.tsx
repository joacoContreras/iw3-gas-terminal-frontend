import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  indicatorColor?: string;
  showLabel?: boolean;
}

export function Progress({
  value,
  indicatorColor = "bg-blue-600",
  showLabel = false,
  className,
  ...props
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value || 0));

  return (
    <div className={cn("w-full space-y-1", className)} {...props}>
      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700/60">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            indicatorColor
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span>Progreso</span>
          <span>{clampedValue.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
