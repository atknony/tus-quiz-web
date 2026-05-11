import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  backLabel?: string;
  onBack?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  eyebrow,
  backLabel,
  onBack,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {backLabel ?? "Geri"}
        </button>
      )}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          {eyebrow && <div className="text-eyebrow text-muted-foreground">{eyebrow}</div>}
          <h1 className="font-serif text-h1 text-foreground">{title}</h1>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
