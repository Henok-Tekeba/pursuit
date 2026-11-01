import {
  AlarmClock,
  BadgeCheck,
  CalendarDays,
  Circle,
  ClipboardCheck,
  Ghost,
  MessageCircle,
  Undo2,
  X,
  Clock3,
} from "lucide-react";
import type { ApplicationStatus } from "@/lib/db/schema";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_ICONS: Record<ApplicationStatus, typeof Circle> = {
  applied: Circle,
  awaiting_response: Clock3,
  replied: MessageCircle,
  follow_up_due: AlarmClock,
  interview: CalendarDays,
  assessment: ClipboardCheck,
  offer: BadgeCheck,
  rejected: X,
  ghosted: Ghost,
  withdrawn: Undo2,
};

export function StatusBadge({
  status,
  className,
  withIcon = true,
}: {
  status: ApplicationStatus;
  className?: string;
  withIcon?: boolean;
}) {
  const Icon = STATUS_ICONS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-[4px] border px-1.5 py-[3px] text-[11.5px] font-medium leading-none",
        STATUS_STYLES[status].className,
        "dark:border-white/10 dark:bg-white/[0.055]",
        className,
      )}
    >
      {withIcon && <Icon className="size-2.5 shrink-0" strokeWidth={2.2} />}
      {STATUS_LABELS[status]}
    </span>
  );
}

export function StatusDot({ status, className }: { status: ApplicationStatus; className?: string }) {
  return <span className={cn("size-1.5 rounded-full", STATUS_STYLES[status].dot, className)} />;
}
