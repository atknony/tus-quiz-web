import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "accent";
type BadgeSize = "sm" | "md";

interface SemanticBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  icon?: React.ReactNode;
}

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-sunken text-foreground border-border",
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/20",
  danger: "bg-danger-soft text-danger border-danger/20",
  accent: "bg-accent text-accent-foreground border-accent",
};

const sizes: Record<BadgeSize, string> = {
  sm: "text-[11px] px-2 py-0.5 gap-1 [&_svg]:w-3 [&_svg]:h-3",
  md: "text-caption px-2.5 py-1 gap-1.5 [&_svg]:w-3.5 [&_svg]:h-3.5",
};

export const SemanticBadge = React.forwardRef<HTMLSpanElement, SemanticBadgeProps>(
  ({ tone = "neutral", size = "md", icon, className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border font-medium tracking-tight whitespace-nowrap",
          tones[tone],
          sizes[size],
          className
        )}
        {...props}
      >
        {icon}
        {children}
      </span>
    );
  }
);
SemanticBadge.displayName = "SemanticBadge";
