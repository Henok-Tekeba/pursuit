import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  CalendarCheck,
  Download,
  MessageSquareReply,
  Plus,
  Repeat2,
  Sparkles,
  Timer,
} from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getAnalytics } from "@/lib/queries/applications";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { METHOD_LABELS, STATUS_LABELS, STATUS_STYLES } from "@/lib/constants";
import { cn, formatDate, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const analytics = await getAnalytics(user.id);

  const metrics = [
    {
      label: "Response rate",
      value: `${analytics.responseRate}%`,
      caption: `${analytics.responses} of ${analytics.total} applications`,
      icon: MessageSquareReply,
      tone: "bg-[#edf5fb] text-[#3d7da5] dark:bg-[#182730] dark:text-[#82b7d7]",
    },
    {
      label: "Interview conversion",
      value: `${analytics.interviewRate}%`,
      caption: `${analytics.interviews} interviews and beyond`,
      icon: CalendarCheck,
      tone: "bg-[#f3eefb] text-[#7557b7] dark:bg-[#261f35] dark:text-[#b8a2e1]",
    },
    {
      label: "Offer rate",
      value: `${analytics.offerRate}%`,
      caption: `${analytics.offers} offer${analytics.offers === 1 ? "" : "s"} received`,
      icon: BadgeCheck,
      tone: "bg-[#effaf4] text-[#2e8a61] dark:bg-[#1c3026] dark:text-[#7bc6a1]",
    },
    {
      label: "Avg. response time",
      value: analytics.averageResponseDays ? `${analytics.averageResponseDays}d` : "N/A",
      caption:
        analytics.responses > 0
          ? "From application to first reply"
          : "No responses recorded yet",
      icon: Timer,
      tone: "bg-[#fff6e8] text-[#b47b2c] dark:bg-[#302619] dark:text-[#dfb56e]",
    },
    {
      label: "Follow-up effectiveness",
      value: analytics.followUpsSent ? `${analytics.followUpEffectiveness}%` : "N/A",
      caption:
        analytics.followUpsSent > 0
          ? `${analytics.respondedAfterFollowUp} of ${analytics.followUpsSent} follow-up threads replied`
          : "No follow-ups sent yet",
      icon: Repeat2,
      tone: "bg-[#f0f7f3] text-[#3a956b] dark:bg-[#1d2e26] dark:text-[#8bc8ac]",
    },
  ];

  return (
    <div className="min-h-full pb-6">
      <PageHeader
        title="Analytics"
        description={
          <span className="inline-flex items-center gap-1.5">
            <BarChart3 className="size-2.5 text-[#5b8def]" />
            A clear-eyed look at your search so far
            {user.isDemo && (
              <>
                <span className="text-ink-faint">·</span>
                <span className="rounded-[3px] border border-line bg-surface-subtle px-1 py-0.5 text-[9.5px] text-ink-muted">
                  Demo workspace · sample data
                </span>
              </>
            )}
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <a href="/api/export">
                <Download className="size-3.5" strokeWidth={1.8} />
                Export CSV
              </a>
            </Button>
            <Button asChild size="sm">
              <Link href="/applications/new">
                <Plus className="size-3.5" />
                New application
              </Link>
            </Button>
          </>
        }
      />

      {analytics.total === 0 ? (
        <div className="p-4 lg:p-5">
          <div className="rounded-[11px] border border-line bg-surface-card shadow-card">
            <EmptyState
              icon={BarChart3}
              title="Your analytics will grow with your search"
              description="Response rates, interview conversion, and follow-up effectiveness appear here once you've added applications and logged a few conversations."
              action={
                <Button asChild size="sm">
                  <Link href="/applications/new">Add your first application</Link>
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 min-[1200px]:grid-cols-5">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="rounded-[10px] border border-line bg-surface-card p-3.5 shadow-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                      {metric.label}
                    </p>
                    <span className={cn("grid size-6 shrink-0 place-items-center rounded-md", metric.tone)}>
                      <Icon className="size-3" strokeWidth={1.7} />
                    </span>
                  </div>
                  <p className="mt-2 text-[29px] font-medium leading-none tracking-[-0.045em] text-ink">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">{metric.caption}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
            <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div>
                  <h2 className="text-[13.5px] font-medium text-ink">Application activity</h2>
                  <p className="mt-0.5 text-[10.5px] text-ink-muted">Applications sent over the last 6 months</p>
                </div>
                <span className="text-[10.5px] text-ink-faint">{analytics.total} total</span>
              </div>
              <div className="p-4 lg:p-5">
                <div className="flex h-[164px] items-end gap-3">
                  {analytics.monthly.map((month) => {
                    const max = Math.max(...analytics.monthly.map((entry) => entry.count), 1);
                    const height = Math.max(6, (month.count / max) * 128);
                    const monthLabel = formatDate(new Date(`${month.month}-01T00:00:00Z`), "MMM");
                    return (
                      <div key={month.month} className="flex flex-1 flex-col items-center gap-2">
                        <span className="text-[10px] font-medium tabular-nums text-ink-muted">
                          {month.count || ""}
                        </span>
                        <div
                          className={cn(
                            "w-full max-w-[54px] rounded-t-[4px] transition-all",
                            month.count > 0 ? "bg-[#1d2130] dark:bg-white/70" : "bg-surface-subtle",
                          )}
                          style={{ height: `${height}px` }}
                          title={`${monthLabel}: ${month.count} applications`}
                        />
                        <span className="text-[10px] text-ink-faint">{monthLabel}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-[10px] text-ink-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-[2px] bg-[#1d2130] dark:bg-white/70" />
                    Applications
                  </span>
                  <span className="ml-auto">Reflects every status, including closed applications</span>
                </div>
              </div>
            </section>

            <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div>
                  <h2 className="text-[13.5px] font-medium text-ink">Follow-up effectiveness</h2>
                  <p className="mt-0.5 text-[10.5px] text-ink-muted">Replies earned after a nudge</p>
                </div>
                <Repeat2 className="size-3.5 text-ink-muted" />
              </div>
              <div className="flex flex-col items-center p-4">
                <div
                  className="relative grid size-[120px] place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(#17171c ${analytics.followUpEffectiveness * 3.6}deg, #f0f0f2 0deg)`,
                  }}
                >
                  <div className="grid size-[92px] place-items-center rounded-full bg-surface-card">
                    <div className="text-center">
                      <p className="text-[22px] font-medium leading-none tracking-[-0.04em] text-ink">
                        {analytics.followUpsSent ? `${analytics.followUpEffectiveness}%` : "N/A"}
                      </p>
                      <p className="mt-1 text-[9.5px] text-ink-faint">reply rate</p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-[10.5px] leading-relaxed text-ink-muted">
                  {analytics.followUpsSent > 0
                    ? `${analytics.respondedAfterFollowUp} of ${analytics.followUpsSent} applications with a follow-up received a reply afterward.`
                    : "Log a follow-up from an application to start measuring what works."}
                </p>
                <Link
                  href="/follow-ups"
                  className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-medium text-ink underline underline-offset-2"
                >
                  Review follow-ups
                  <ArrowUpRight className="size-2.5" />
                </Link>
              </div>
            </section>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div>
                  <h2 className="text-[13.5px] font-medium text-ink">Conversion funnel</h2>
                  <p className="mt-0.5 text-[10.5px] text-ink-muted">From first outreach to offer</p>
                </div>
                <Sparkles className="size-3.5 text-ink-muted" />
              </div>
              <div className="space-y-3 p-4">
                <FunnelRow label="Applications" value={analytics.total} rate={100} color="bg-[#6d8aa6]" />
                <FunnelRow
                  label="Responses received"
                  value={analytics.responses}
                  rate={analytics.responseRate}
                  color="bg-[#4d91c7]"
                />
                <FunnelRow
                  label="Interviews & beyond"
                  value={analytics.interviews}
                  rate={analytics.interviewRate}
                  color="bg-[#8a6fd0]"
                />
                <FunnelRow
                  label="Offers"
                  value={analytics.offers}
                  rate={analytics.offerRate}
                  color="bg-[#4aa47a]"
                />
                <p className="pt-1 text-[10px] leading-relaxed text-ink-faint">
                  Interview conversion counts applications that progressed to interview, assessment, or offer.
                </p>
              </div>
            </section>

            <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div>
                  <h2 className="text-[13.5px] font-medium text-ink">Status breakdown</h2>
                  <p className="mt-0.5 text-[10.5px] text-ink-muted">Where every application stands</p>
                </div>
                <span className="text-[10.5px] text-ink-faint">{analytics.total} total</span>
              </div>
              <div className="p-4 lg:p-5">
                <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-surface-subtle">
                  {analytics.statusCounts.map((entry) => (
                    <span
                      key={entry.status}
                      className={cn("h-full", STATUS_STYLES[entry.status].dot)}
                      style={{ width: `${(entry.count / analytics.total) * 100}%` }}
                      title={`${STATUS_LABELS[entry.status]}: ${entry.count}`}
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  {analytics.statusCounts.map((entry) => (
                    <div key={entry.status} className="flex items-center gap-2">
                      <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_STYLES[entry.status].dot)} />
                      <span className="w-[110px] shrink-0 text-[10.5px] text-ink-muted">
                        {STATUS_LABELS[entry.status]}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-subtle">
                        <span
                          className={cn("block h-full rounded-full", STATUS_STYLES[entry.status].dot)}
                          style={{ width: `${(entry.count / analytics.total) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-[10.5px] font-medium tabular-nums text-ink-secondary">
                        {entry.count}
                      </span>
                      <span className="w-8 text-right text-[10px] tabular-nums text-ink-faint">
                        {percent(entry.count, analytics.total)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
              <div className="border-b border-line px-4 py-3">
                <h2 className="text-[13.5px] font-medium text-ink">Application methods</h2>
                <p className="mt-0.5 text-[10.5px] text-ink-muted">Where your applications come from</p>
              </div>
              <div className="space-y-2.5 p-4">
                {analytics.methodCounts.map((entry) => (
                  <div key={entry.method} className="flex items-center gap-2">
                    <span className="w-[92px] text-[10.5px] text-ink-muted">
                      {METHOD_LABELS[entry.method as keyof typeof METHOD_LABELS]}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-subtle">
                      <span
                        className="block h-full rounded-full bg-[#1d2130] dark:bg-white/60"
                        style={{ width: `${(entry.count / analytics.total) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-[10.5px] font-medium tabular-nums text-ink-secondary">
                      {entry.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex flex-col justify-between rounded-[10px] border border-line bg-surface-card p-4 shadow-card">
              <div>
                <p className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-faint">
                  <Sparkles className="size-3 text-[#b47b2c]" />
                  A note on the numbers
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-secondary">
                  These metrics are calculated from your own application and email history, never from
                  benchmarks. Response rate includes any recorded inbound reply, even if the application later
                  closed. Follow-up effectiveness only counts replies that arrived after a follow-up was sent.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <Button asChild variant="outline" size="xs">
                  <a href="/api/export">
                    <Download className="size-3" />
                    Export all data
                  </a>
                </Button>
                <Button asChild variant="ghost" size="xs">
                  <Link href="/settings">
                    Follow-up settings
                    <ArrowUpRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function FunnelRow({
  label,
  value,
  rate,
  color,
}: {
  label: string;
  value: number;
  rate: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-[10.5px]">
        <span className="text-ink-muted">{label}</span>
        <span className="font-medium text-ink-secondary">
          {value} <span className="font-normal text-ink-faint">· {rate}%</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-subtle">
        <span
          className={cn("block h-full rounded-full", color)}
          style={{ width: `${Math.max(rate, value > 0 ? 3 : 0)}%` }}
        />
      </div>
    </div>
  );
}
