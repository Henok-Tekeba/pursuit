import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 py-8" : "gap-3 py-14",
        className,
      )}
    >
      <div className="grid size-10 place-items-center rounded-xl border border-line bg-surface-subtle text-ink-muted">
        <Icon className="size-4" strokeWidth={1.7} />
      </div>
      <div>
        <h3 className="text-[14px] font-medium text-ink">{title}</h3>
        {description && (
          <p className="mx-auto mt-1 max-w-[300px] text-[12.5px] leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
