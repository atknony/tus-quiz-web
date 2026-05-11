import * as React from "react";
import { cn } from "@/lib/utils";

type SurfaceVariant = "default" | "inset" | "interactive";
type SurfaceTone = "neutral" | "success" | "warning" | "danger" | "accent";

interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  tone?: SurfaceTone;
  padding?: "none" | "sm" | "md" | "lg";
  asChild?: boolean;
}

const toneLeftBar: Record<SurfaceTone, string> = {
  neutral: "",
  success: "border-l-2 border-l-success",
  warning: "border-l-2 border-l-warning",
  danger: "border-l-2 border-l-danger",
  accent: "border-l-2 border-l-accent",
};

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export const SurfaceCard = React.forwardRef<HTMLDivElement, SurfaceCardProps>(
  ({ className, variant = "default", tone = "neutral", padding = "md", children, ...props }, ref) => {
    const base = "rounded-2xl border transition-colors";

    const variants: Record<SurfaceVariant, string> = {
      default: "bg-surface border-border shadow-card",
      inset: "bg-surface-sunken border-border/60",
      interactive:
        "bg-surface border-border shadow-card cursor-pointer hover:border-border-strong hover:shadow-card-hover",
    };

    return (
      <div
        ref={ref}
        className={cn(base, variants[variant], toneLeftBar[tone], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SurfaceCard.displayName = "SurfaceCard";
