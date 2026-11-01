import Link from "next/link";
import { AlarmClock, ArrowUpRight, Briefcase, CalendarCheck, MessageSquareReply } from "lucide-react";
import type { DashboardData } from "@/lib/queries/applications";
import { STATUS_LABELS } from "@/lib/constants";
import { cn, daysUntil, getFollowUpLabel } from "@/lib/utils";
import { QuickFollowUp } from "./quick-follow-up";

export function DashboardMetrics({ data }: { data: DashboardData }) {
  const overdue = data.dueFollowUps.filter(
    (item) => item.nextFollowUpAt && (daysUntil(item.nextFollowUpAt) ?? 0) < 0,
  ).length;
  const dueToday = data.dueFollowUps.length - overdue;

  const metrics = [
    {
      label: "Total applications",
      value: data.total,
      caption: `${data.active} active conversation${data.active === 1 ? "" : "s"}`,
      icon: Briefcase,
      tone: "bg-[#eef2f5] text-[#5b6b7b] dark:bg-white/[0.06] dark:text-[#aab8c4]",
    },
    {
      label: "Responses received",
      value: data.responses,
      caption: `${data.responseRate}% response rate`,
      icon: MessageSquareReply,
      tone: "bg-[#edf5fb] text-[#3d7da5] dark:bg-[#182730] dark:text-[#82b7d7]",
    },
    {
      label: "Follow-ups due",
      value: data.dueFollowUps.length,
      caption:
        data.dueFollowUps.length === 0
          ? "Nothing due. Nice work"
          : `${overdue} overdue · ${dueToday} due today`,
      icon: AlarmClock,
      tone: "bg-[#fff5e8] text-[#b47b2c] dark:bg-[#302619] dark:text-[#dfb56e]",
    },
    {
      label: "Interviews",
      value: data.interviews,
      caption: `${data.offers} offer${data.offers === 1 ? "" : "s"} in motion`,
      icon: CalendarCheck,
      tone: "bg-[#f3eefb] text-[#7557b7] dark:bg-[#261f35] dark:text-[#b8a2e1]",
    },
  ];

  return (
    <div
      data-tour="dashboard-metrics"
      className="grid grid-cols-2 divide-y divide-line border-b border-line sm:divide-y-0 lg:grid-cols-4 lg:divide-x"
    >
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className={cn(
              "flex items-start justify-between gap-3 px-4 py-3.5",
              index > 0 && index % 2 === 1 && "border-l border-line lg:border-l-0",
              index >= 2 && "sm:border-t-0",
            )}
          >
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-ink-muted">
                {metric.label}
              </p>
              <p className="mt-1.5 text-[26px] font-medium leading-none tracking-[-0.04em] text-ink">
                {metric.value}
              </p>
              <p className="mt-1.5 truncate text-[10.5px] text-ink-muted">{metric.caption}</p>
            </div>
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", metric.tone)}>
              <Icon className="size-3.5" strokeWidth={1.7} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function TodaysActions({
  data,
  upcomingCount,
}: {
  data: DashboardData["dueFollowUps"];
  upcomingCount: number;
}) {
  return (
    <section className="rounded-[10px] border border-line bg-surface-card">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-3">
        <div>
          <h2 className="text-[13px] font-medium text-ink">Today&apos;s action items</h2>
          <p className="mt-0.5 text-[10.5px] text-ink-muted">
            {data.length > 0 ? "Keep the conversation moving" : "Your outreach is up to date"}
          </p>
        </div>
        {data.length > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#fff3e6] px-1.5 text-[10.5px] font-medium text-[#c1842c] dark:bg-[#362a1b]">
            {data.length}
          </span>
        ) : (
          <span className="size-1.5 rounded-full bg-[#4aa47a]" />
        )}
      </div>
      <div className="p-1.5">
        {data.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <div className="mx-auto grid size-8 place-items-center rounded-full bg-[#eff9f3] text-[#3a956b] dark:bg-[#1f3329]">
              <CalendarCheck className="size-3.5" />
            </div>
            <p className="mt-2 text-[12.5px] font-medium text-ink">Nothing due today</p>
            <p className="mx-auto mt-1 max-w-[190px] text-[11px] leading-relaxed text-ink-muted">
              {upcomingCount > 0
                ? `${upcomingCount} follow-up${upcomingCount === 1 ? "" : "s"} coming up in the next 7 days.`
                : "Spend the extra time on a fresh, thoughtful note."}
            </p>
          </div>
        ) : (
          data.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="rounded-lg px-2 py-2 transition-colors hover:bg-surface-hover"
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-[#fff6ea] text-[#c1842c] dark:bg-[#352a1c]">
                  <AlarmClock className="size-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/applications/${item.id}`}
                    className="block truncate text-[12px] font-medium text-ink hover:underline"
                  >
                    {item.companyName}
                  </Link>
                  <p className="truncate text-[10.5px] text-ink-muted">{item.position}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium text-[#c1842c]">
                      <FollowUpUrgency date={item.nextFollowUpAt} />
                    </span>
                    <div className="flex items-center gap-2">
                      <QuickFollowUpLink
                        application={{
                          id: item.id,
                          companyName: item.companyName,
                          position: item.position,
                          contactName: item.contactName,
                          nextFollowUpAt: item.nextFollowUpAt,
                        }}
                      />
                      <Link
                        href={`/applications/${item.id}`}
                        className="text-[10.5px] text-ink-faint transition-colors hover:text-ink"
                        aria-label={`Open ${item.companyName}`}
                      >
                        <ArrowUpRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-line p-1.5">
        <Link
          href="/follow-ups"
          className="flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
        >
          Review all follow-ups
          <ArrowUpRight className="size-3" />
        </Link>
      </div>
    </section>
  );
}

function FollowUpUrgency({ date }: { date: string | null }) {
  return <>{getFollowUpLabel(date)}</>;
}

function QuickFollowUpLink({
  application,
}: {
  application: {
    id: string;
    companyName: string;
    position: string;
    contactName: string | null;
    nextFollowUpAt: string | null;
  };
}) {
  return <QuickFollowUp application={application} />;
}

export function StatusOverview({ data }: { data: DashboardData }) {
  const entries = data.statusCounts.filter((entry) => entry.count > 0);
  return (
    <section className="rounded-[10px] border border-line bg-surface-card">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-3">
        <div>
          <h2 className="text-[13px] font-medium text-ink">Status overview</h2>
          <p className="mt-0.5 text-[10.5px] text-ink-muted">Across your whole pipeline</p>
        </div>
        <Link
          href="/analytics"
          className="text-[10.5px] text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
      {entries.length === 0 ? (
        <div className="px-3.5 py-6 text-center text-[11px] text-ink-muted">
          Your status mix will appear here.
        </div>
      ) : (
        <div className="p-3.5">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-subtle">
            {entries.map((entry) => (
              <span
                key={entry.status}
                title={`${entry.status}: ${entry.count}`}
                className={cn("h-full", STATUS_DOTS[entry.status])}
                style={{ width: `${(entry.count / data.total) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
            {entries.map((entry) => (
              <div key={entry.status} className="flex items-center gap-1.5">
                <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOTS[entry.status])} />
                <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink-muted">{STATUS_LABELS[entry.status]}</span>
                <span className="text-[10.5px] font-medium tabular-nums text-ink-secondary">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

const STATUS_DOTS: Record<string, string> = {
  applied: "bg-[#6d8aa6]",
  awaiting_response: "bg-[#a19a68]",
  replied: "bg-[#4d91c7]",
  follow_up_due: "bg-[#e8a240]",
  interview: "bg-[#8a6fd0]",
  assessment: "bg-[#6d7ed3]",
  offer: "bg-[#4aa47a]",
  rejected: "bg-[#dc6478]",
  ghosted: "bg-[#8d8d94]",
  withdrawn: "bg-[#a3a3a8]",
};
