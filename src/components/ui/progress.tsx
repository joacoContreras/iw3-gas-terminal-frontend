import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  indicatorColor?: string;
  showLabel?: boolean;
}

export function Progress({
  value,
  indicatorColor = "bg-linear-to-r from-accent to-accent-bright",
  showLabel = false,
  className,
  ...props
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value || 0));

  return (
    <div className={cn("w-full space-y-1", className)} {...props}>
      <div role="progressbar" aria-label="Progreso" aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100} className="h-3 w-full overflow-hidden rounded-full bg-elevated p-0.5 border border-line">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            indicatorColor
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-muted">
          <span>Progreso</span>
          <span>{clampedValue.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
