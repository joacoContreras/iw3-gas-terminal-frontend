import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "danger" | "info" | "outline";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "border border-accent/30 bg-accent/10 text-accent",
    secondary: "border border-inactive/30 bg-inactive/10 text-muted",
    success: "bg-success/10 text-success border border-success/30",
    warning: "bg-warning/10 text-warning border border-warning/30",
    danger: "bg-danger/10 text-danger-ink border border-danger/30",
    info: "bg-accent/10 text-accent border border-accent/30",
    outline: "text-foreground border border-line",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
