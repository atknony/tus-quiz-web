import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center text-center py-10 px-4", className)}>
      {icon && (
        <div className="text-muted-soft mb-3 [&_svg]:w-8 [&_svg]:h-8" aria-hidden>
          {icon}
        </div>
      )}
      <div className="font-serif text-h2 text-foreground">{title}</div>
      {description && (
        <p className="mt-2 max-w-sm text-body text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
