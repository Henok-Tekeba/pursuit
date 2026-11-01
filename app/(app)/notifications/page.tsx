import type { Metadata } from "next";
import Link from "next/link";
import {
  AlarmClock,
  ArrowUpRight,
  Bell,
  CalendarCheck,
  CalendarClock,
  MessageSquareReply,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData, getEmailsForUser } from "@/lib/queries/applications";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { QuickFollowUp } from "@/components/dashboard/quick-follow-up";
import { PersonAvatar } from "@/components/company-avatar";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { cn, formatDate, formatDateWithTime, getFollowUpLabel, isOverdue } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const [data, inboundEmails] = await Promise.all([
    getDashboardData(user.id),
    getEmailsForUser(user.id, { direction: "inbound" }),
  ]);
  const replies = inboundEmails.slice(0, 5);
  const totalAttention = data.dueFollowUps.length + replies.length;

  return (
    <div className="min-h-full pb-6">
      <PageHeader
        title="Notifications"
        description={
          <span className="inline-flex items-center gap-1.5">
            <Bell className="size-2.5 text-[#5b8def]" />
            {totalAttention > 0
              ? `${totalAttention} item${totalAttention === 1 ? "" : "s"} worth your attention`
              : "Everything is tidy"}
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/follow-ups">All follow-ups</Link>
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

      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-4">
          <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-md bg-[#fff6e8] text-[#b47b2c] dark:bg-[#302619]">
                  <AlarmClock className="size-3" />
                </span>
                <div>
                  <h2 className="text-[13.5px] font-medium text-ink">Follow-ups due</h2>
                  <p className="mt-0.5 text-[10.5px] text-ink-muted">Overdue and due today</p>
                </div>
              </div>
              <span className="text-[10.5px] text-ink-faint">{data.dueFollowUps.length} items</span>
            </div>
            {data.dueFollowUps.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Nothing due"
                description="You're up to date. The next scheduled follow-up will appear here."
                compact
              />
            ) : (
              <div className="divide-y divide-line">
                {data.dueFollowUps.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <PersonAvatar
                      name={item.contactName || item.companyName}
                      src={item.contactAvatarUrl}
                      className="size-8"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/applications/${item.id}`}
                        className="truncate text-[12.5px] font-medium text-ink hover:underline"
                      >
                        {item.companyName}
                      </Link>
                      <p className="mt-0.5 truncate text-[10.5px] text-ink-muted">{item.position}</p>
                    </div>
                    <span
                      className={cn(
                        "hidden rounded-[3px] px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex",
                        isOverdue(item.nextFollowUpAt)
                          ? "bg-[#fff1e6] text-[#c07a2b] dark:bg-[#3a2b1c]"
                          : "bg-[#fff9ee] text-[#b47b2c] dark:bg-[#352c1d]",
                      )}
                    >
                      {getFollowUpLabel(item.nextFollowUpAt)}
                    </span>
                    <div className="shrink-0">
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
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-md bg-[#edf7fd] text-[#357ba9] dark:bg-[#192a34]">
                  <MessageSquareReply className="size-3" />
                </span>
                <div>
                  <h2 className="text-[13.5px] font-medium text-ink">Recent replies</h2>
                  <p className="mt-0.5 text-[10.5px] text-ink-muted">The latest responses from your outreach</p>
                </div>
              </div>
              <Link href="/emails" className="text-[10.5px] text-ink-muted hover:text-ink">
                View emails
              </Link>
            </div>
            {replies.length === 0 ? (
              <EmptyState
                icon={MessageSquareReply}
                title="No replies yet"
                description="When a response arrives, log it from the application and it will surface here."
                compact
              />
            ) : (
              <div className="divide-y divide-line">
                {replies.map((email) => (
                  <Link
                    key={email.id}
                    href={`/applications/${email.applicationId}`}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
                  >
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-line bg-surface-subtle text-[10.5px] font-medium text-ink-secondary">
                      {email.companyName.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-ink">{email.subject}</p>
                      <p className="mt-0.5 truncate text-[10.5px] text-ink-muted">
                        {email.companyName} · {email.position}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-ink-faint">
                      {formatDateWithTime(email.occurredAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <CalendarClock className="size-3.5 text-ink-muted" />
              <div>
                <h2 className="text-[13.5px] font-medium text-ink">Coming up</h2>
                <p className="mt-0.5 text-[10.5px] text-ink-muted">Scheduled in the next 7 days</p>
              </div>
            </div>
            {data.upcomingFollowUps.length === 0 ? (
              <p className="px-4 py-6 text-center text-[11px] text-ink-muted">
                No upcoming follow-ups scheduled.
              </p>
            ) : (
              <div className="divide-y divide-line">
                {data.upcomingFollowUps.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/applications/${item.id}`}
                    className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-surface-hover"
                  >
                    <span className="grid size-6 place-items-center rounded-md bg-[#eff9f3] text-[#3a956b] dark:bg-[#203229]">
                      <CalendarCheck className="size-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-medium text-ink">{item.companyName}</p>
                      <p className="mt-0.5 truncate text-[10px] text-ink-muted">{item.position}</p>
                    </div>
                    <span className="text-[10px] text-[#3a956b]">
                      {formatDate(item.nextFollowUpAt, "MMM d")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[10px] border border-line bg-surface-card p-4 shadow-card">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-md bg-surface-subtle text-ink-muted">
                <ArrowUpRight className="size-3" />
              </span>
              <p className="text-[12px] font-medium text-ink">Follow-ups work</p>
            </div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-ink-muted">
              A short, specific nudge sent 5 to 7 days after your first email is often the difference between a
              quiet inbox and a real conversation.
            </p>
            <Button asChild variant="outline" size="xs" className="mt-3">
              <Link href="/analytics">See your effectiveness</Link>
            </Button>
          </section>

          <section className="rounded-[10px] border border-line bg-surface-card p-4 shadow-card">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-ink-faint">Status mix</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {data.statusCounts
                .filter((entry) => entry.count > 0)
                .map((entry) => (
                  <StatusBadge key={entry.status} status={entry.status} />
                ))}
              {data.statusCounts.every((entry) => entry.count === 0) && (
                <span className="text-[10.5px] text-ink-muted">No applications yet.</span>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
