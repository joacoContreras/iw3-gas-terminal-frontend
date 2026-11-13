import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = "relative inline-flex shrink-0 items-center justify-center rounded-lg border font-semibold transition-colors duration-180 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-45 disabled:pointer-events-none active:translate-y-px cursor-pointer";
    const variantStyles = {
      primary: "border-accent bg-accent text-canvas hover:border-accent-bright hover:bg-accent-bright shadow-sm",
      secondary: "border-line bg-elevated text-foreground hover:border-control-line shadow-sm",
      outline: "border-control-line bg-transparent text-foreground hover:bg-elevated hover:border-accent/50",
      danger: "border-danger bg-danger text-canvas hover:bg-danger/85 shadow-sm",
      ghost: "border-transparent text-muted hover:bg-elevated hover:text-foreground",
    };

    const sizeStyles = {
      sm: "min-h-9 px-3 py-2 text-xs gap-1.5",
      md: "min-h-11 px-4 py-2.5 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        <span className={cn("inline-flex items-center justify-center gap-2", isLoading && "opacity-0")}>{children}</span>
      </button>
    );
  }
);
Button.displayName = "Button";
