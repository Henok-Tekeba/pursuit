import {
  AlarmClock,
  ArrowDownLeft,
  ArrowUpRight,
  Award,
  CalendarDays,
  ClipboardCheck,
  FilePenLine,
  Plus,
  Reply,
  Sparkles,
  XCircle,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import type { ActivityType } from "@/lib/db/schema";
import { cn, formatDateWithTime } from "@/lib/utils";

type TimelineActivity = {
  id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  occurredAt: string;
};

const ACTIVITY_STYLES: Record<
  ActivityType,
  { icon: LucideIcon; className: string; iconClass: string }
> = {
  application_created: {
    icon: Plus,
    className: "bg-[#f2f4f6] text-[#5b6b7b] dark:bg-white/[0.06]",
    iconClass: "",
  },
  email_sent: {
    icon: ArrowUpRight,
    className: "bg-[#f2f4f6] text-[#5b6b7b] dark:bg-white/[0.06]",
    iconClass: "",
  },
  email_received: {
    icon: ArrowDownLeft,
    className: "bg-[#edf7fd] text-[#357ba9] dark:bg-[#192a34]",
    iconClass: "",
  },
  follow_up_sent: {
    icon: AlarmClock,
    className: "bg-[#fff6e8] text-[#b47b2c] dark:bg-[#302619]",
    iconClass: "",
  },
  reply_received: {
    icon: Reply,
    className: "bg-[#edf7fd] text-[#357ba9] dark:bg-[#192a34]",
    iconClass: "",
  },
  interview_scheduled: {
    icon: CalendarDays,
    className: "bg-[#f4effc] text-[#7557b7] dark:bg-[#261f35]",
    iconClass: "",
  },
  assessment_received: {
    icon: ClipboardCheck,
    className: "bg-[#eef1fc] text-[#5668b5] dark:bg-[#20243a]",
    iconClass: "",
  },
  status_changed: {
    icon: Sparkles,
    className: "bg-[#f5f5f6] text-[#6f6f77] dark:bg-white/[0.06]",
    iconClass: "",
  },
  note_added: {
    icon: FilePenLine,
    className: "bg-[#f5f5f6] text-[#6f6f77] dark:bg-white/[0.06]",
    iconClass: "",
  },
  follow_up_scheduled: {
    icon: CalendarDays,
    className: "bg-[#fbf7ed] text-[#8c7b3d] dark:bg-[#2d291d]",
    iconClass: "",
  },
  offer_received: {
    icon: Award,
    className: "bg-[#effaf4] text-[#2e8a61] dark:bg-[#1c3026]",
    iconClass: "",
  },
  rejection_received: {
    icon: XCircle,
    className: "bg-[#fff4f6] text-[#c24e63] dark:bg-[#301e23]",
    iconClass: "",
  },
  withdrawn: {
    icon: Undo2,
    className: "bg-[#f5f5f6] text-[#8a8a90] dark:bg-white/[0.06]",
    iconClass: "",
  },
};

export function ActivityTimeline({ activities }: { activities: TimelineActivity[] }) {
  if (!activities.length) {
    return (
      <div className="rounded-lg border border-dashed border-line px-4 py-10 text-center">
        <p className="text-[12.5px] font-medium text-ink">The timeline starts here</p>
        <p className="mt-1 text-[11px] text-ink-muted">
          Emails, replies, and status changes will appear in this timeline.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] text-ink-muted">
          Every interaction is preserved in order. Newest first.
        </p>
        <span className="flex items-center gap-1 text-[10px] text-ink-faint">
          <span className="size-1 rounded-full bg-[#4aa47a]" />
          {activities.length} event{activities.length === 1 ? "" : "s"}
        </span>
      </div>
      <ol className="relative">
        <span className="absolute bottom-2 left-[13px] top-2 w-px bg-line" aria-hidden="true" />
        {activities.map((activity) => {
          const style = ACTIVITY_STYLES[activity.type] ?? ACTIVITY_STYLES.email_sent;
          const Icon = style.icon;
          return (
            <li key={activity.id} className="relative flex gap-3 pb-4 last:pb-0">
              <span
                className={cn(
                  "relative z-10 grid size-[27px] shrink-0 place-items-center rounded-full border border-surface-card ring-1 ring-line",
                  style.className,
                )}
              >
                <Icon className="size-3" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="text-[12px] font-medium text-ink">{activity.title}</p>
                  <time
                    dateTime={activity.occurredAt}
                    className="text-[10px] tabular-nums text-ink-faint"
                  >
                    {formatDateWithTime(activity.occurredAt)}
                  </time>
                </div>
                {activity.description && (
                  <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-ink-muted">
                    {activity.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
