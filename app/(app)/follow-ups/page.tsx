import type { Metadata } from "next";
import Link from "next/link";
import { AlarmClock, ArrowUpRight, CalendarCheck, CalendarClock, Download, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getFollowUpApplications } from "@/lib/queries/applications";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/company-avatar";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { QuickFollowUp } from "@/components/dashboard/quick-follow-up";
import { cn, daysSince, formatDate, getFollowUpLabel, isOverdue } from "@/lib/utils";

export const metadata: Metadata = { title: "Follow-ups" };
export const dynamic = "force-dynamic";

const VIEWS = [
  { key: "due", label: "Due & overdue" },
  { key: "upcoming", label: "Upcoming" },
  { key: "all", label: "All scheduled" },
] as const;

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: requestedView } = await searchParams;
  const view = VIEWS.some((entry) => entry.key === requestedView)
    ? (requestedView as "due" | "upcoming" | "all")
    : "due";
  const user = await requireUser();
  const { items, counts } = await getFollowUpApplications(user.id, view);

  return (
    <div className="min-h-full pb-6">
      <PageHeader
        title="Follow-ups"
        description={
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="size-2.5 text-[#5b8def]" />
            {counts.due} due now
            <span className="text-ink-faint">·</span>
            {counts.upcoming} upcoming
            <span className="text-ink-faint">·</span>
            <Link href="/settings" className="underline underline-offset-2 hover:text-ink">
              cadence settings
            </Link>
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <a href="/api/export">
                <Download className="size-3.5" strokeWidth={1.8} />
                Export
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

      <div className="p-4 lg:p-5">
        <div className="rounded-[11px] border border-line bg-surface-card shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div className="flex items-center gap-1">
              {VIEWS.map((entry) => (
                <Link
                  key={entry.key}
                  href={`/follow-ups${entry.key === "due" ? "" : `?view=${entry.key}`}`}
                  className={cn(
                    "flex h-7 items-center rounded-md px-2.5 text-[12px] font-medium transition-colors",
                    view === entry.key
                      ? "bg-ink text-surface-card shadow-sm"
                      : "text-ink-muted hover:bg-surface-hover hover:text-ink",
                  )}
                >
                  {entry.label}
                  <span
                    className={cn(
                      "ml-1.5 text-[10px]",
                      view === entry.key ? "text-surface-card/65" : "text-ink-faint",
                    )}
                  >
                    {entry.key === "due" ? counts.due : entry.key === "upcoming" ? counts.upcoming : counts.all}
                  </span>
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3 text-[10.5px] text-ink-muted">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-[#e8a240]" />
                Due
              </span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-[#4aa47a]" />
                Upcoming
              </span>
            </div>
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={view === "due" ? CalendarCheck : AlarmClock}
              title={view === "due" ? "Nothing due right now" : "No follow-ups here"}
              description={
                view === "due"
                  ? "You're on top of every conversation. New follow-ups will appear here on the dates you planned."
                  : "Schedule a follow-up from any application to see it here."
              }
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/applications">Browse applications</Link>
                </Button>
              }
            />
          ) : (
            <>
            <div className="divide-y divide-line min-[1150px]:hidden">
              {items.map((item) => {
                const overdue = isOverdue(item.nextFollowUpAt);
                return (
                  <div key={item.id} className={cn("px-4 py-3", overdue && "bg-[#fffbf5]/70 dark:bg-[#241f17]/40")}>
                    <div className="flex items-start gap-2.5">
                      <PersonAvatar
                        name={item.contactName || item.companyName}
                        src={item.contactAvatarUrl}
                        className="size-8"
                      />
                      <Link href={`/applications/${item.id}`} className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-[12.5px] font-medium text-ink">{item.companyName}</span>
                          <StatusBadge status={item.status} />
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{item.position}</span>
                        <span className="mt-1 block text-[10.5px] font-medium text-ink">
                          {formatDate(item.nextFollowUpAt)}
                        </span>
                        <span className={cn("mt-0.5 block text-[10px]", overdue ? "text-[#c1842c]" : "text-[#3a956b]")}>
                          {getFollowUpLabel(item.nextFollowUpAt)} · applied {daysSince(item.appliedAt)}d ago
                        </span>
                      </Link>
                      <Link
                        href={`/applications/${item.id}`}
                        className="grid size-7 shrink-0 place-items-center rounded-md border border-line bg-surface-card text-ink-muted"
                        aria-label={`Open ${item.companyName}`}
                      >
                        <ArrowUpRight className="size-3" />
                      </Link>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <QuickFollowUp
                        application={{
                          id: item.id,
                          companyName: item.companyName,
                          position: item.position,
                          contactName: item.contactName,
                          nextFollowUpAt: item.nextFollowUpAt,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto min-[1150px]:block">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#f8f9fb] dark:bg-white/[0.035]">
                    <th className="py-2.5 pl-4 pr-2 text-[11px] font-medium text-ink-muted">Company</th>
                    <th className="px-2 py-2.5 text-[11px] font-medium text-ink-muted">Role</th>
                    <th className="px-2 py-2.5 text-[11px] font-medium text-ink-muted">Applied</th>
                    <th className="px-2 py-2.5 text-[11px] font-medium text-ink-muted">Last contact</th>
                    <th className="px-2 py-2.5 text-[11px] font-medium text-ink-muted">Next follow-up</th>
                    <th className="py-2.5 pl-2 pr-4 text-right text-[11px] font-medium text-ink-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const overdue = isOverdue(item.nextFollowUpAt);
                    return (
                      <tr key={item.id} className={cn("group", overdue && "bg-[#fffbf5]/70 dark:bg-[#241f17]/40")}>
                        <td className="border-b border-line py-3 pl-4 pr-2">
                          <Link href={`/applications/${item.id}`} className="flex items-center gap-2.5">
                            <PersonAvatar
                              name={item.contactName || item.companyName}
                              src={item.contactAvatarUrl}
                              className="size-7"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-[12.5px] font-medium text-ink">
                                {item.companyName}
                              </span>
                              <span className="mt-0.5 block truncate text-[10.5px] text-ink-muted">
                                {item.contactName || item.contactEmail || "No contact"}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="border-b border-line px-2 py-3">
                          <span className="block max-w-[190px] truncate text-[11px] text-ink-secondary">
                            {item.position}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-ink-faint">
                            {item.method.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="border-b border-line px-2 py-3">
                          <span className="block text-[11px] text-ink-secondary">{formatDate(item.appliedAt)}</span>
                          <span className="mt-0.5 block text-[10px] text-ink-faint">
                            {daysSince(item.appliedAt)} days ago
                          </span>
                        </td>
                        <td className="border-b border-line px-2 py-3">
                          <span className="block text-[11px] text-ink-secondary">
                            {item.lastContactAt ? formatDate(item.lastContactAt) : "No contact"}
                          </span>
                          {item.lastContactAt && (
                            <span className="mt-0.5 block text-[10px] text-ink-faint">
                              {daysSince(item.lastContactAt)} days ago
                            </span>
                          )}
                        </td>
                        <td className="border-b border-line px-2 py-3">
                          <span className="block text-[11px] font-medium text-ink">
                            {formatDate(item.nextFollowUpAt)}
                          </span>
                          <span
                            className={cn(
                              "mt-1 inline-flex items-center gap-1 rounded-[3px] px-1 py-0.5 text-[9.5px] font-medium",
                              overdue
                                ? "bg-[#fff1e6] text-[#c07a2b] dark:bg-[#3a2b1c]"
                                : "bg-[#eff9f3] text-[#3a956b] dark:bg-[#203229]",
                            )}
                          >
                            {getFollowUpLabel(item.nextFollowUpAt)}
                          </span>
                        </td>
                        <td className="border-b border-line py-3 pl-2 pr-4">
                          <div className="flex items-center justify-end gap-3">
                            <QuickFollowUp
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
                              className="grid size-7 place-items-center rounded-md border border-line bg-surface-card text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
                              aria-label={`Open ${item.companyName}`}
                            >
                              <ArrowUpRight className="size-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[10.5px] text-ink-faint">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-3" />
              Auto-calculated from your saved follow-up cadence.
            </span>
            <Link href="/settings" className="hover:text-ink hover:underline">
              Edit follow-up intervals
            </Link>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <InfoCard
            title="Why follow up?"
            body="A short, specific follow-up keeps your note visible without adding pressure. Most replies arrive after the first nudge."
            icon={AlarmClock}
          />
          <InfoCard
            title="Never auto-ghosted"
            body="We will never close an application on your behalf. Ghosted is only recorded when you confirm it."
            icon={CalendarCheck}
          />
          <InfoCard
            title="Cadence, your way"
            body="The suggested rhythm is day 5, 10, and 17. Change it once in settings and every new application follows it."
            icon={CalendarClock}
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  body,
  icon: Icon,
}: {
  title: string;
  body: string;
  icon: typeof AlarmClock;
}) {
  return (
    <div className="rounded-[10px] border border-line bg-surface-card p-3.5 shadow-card">
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-md bg-surface-subtle text-ink-muted">
          <Icon className="size-3" />
        </span>
        <p className="text-[12px] font-medium text-ink">{title}</p>
      </div>
      <p className="mt-2 text-[10.5px] leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}
