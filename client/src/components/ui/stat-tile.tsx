import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function StatTile({ label, value, hint, icon, className }: StatTileProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
        {icon && <span className="text-muted-soft [&_svg]:w-3.5 [&_svg]:h-3.5">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="font-serif text-h2 text-foreground tabular-nums">{value}</div>
      {hint && <div className="text-caption text-muted-soft tabular-nums">{hint}</div>}
    </div>
  );
}
