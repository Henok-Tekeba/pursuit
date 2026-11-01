import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 md:px-5",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[22px] font-medium leading-[1.2] tracking-[-0.035em] text-ink">{title}</h1>
        {description && <div className="mt-1.5 text-[12px] text-ink-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
