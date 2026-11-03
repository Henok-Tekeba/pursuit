import type { Metadata } from "next";
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  Download,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { requireAdmin, isAdminEmail } from "@/lib/auth/admin";
import { getAdminOverview } from "@/lib/queries/admin";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatRelative, initialsFor, percent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const overview = await getAdminOverview();
  const { totals, applications: appTotals, dailySignups, users } = overview;
  const maxDaily = Math.max(...dailySignups.map((day) => day.count), 1);
  const onboardingRate = percent(totals.onboarded, totals.users);
  const activationRate = percent(appTotals.activeUsers, totals.users);
  const funnel = [
    {
      label: "Signed up",
      value: totals.users,
      rate: 100,
      color: "bg-[#6d8aa6]",
    },
    {
      label: "Finished onboarding",
      value: totals.onboarded,
      rate: onboardingRate,
      color: "bg-[#4d91c7]",
    },
    {
      label: "Added an application",
      value: appTotals.activeUsers,
      rate: activationRate,
      color: "bg-[#4aa47a]",
    },
  ];

  return (
    <div className="min-h-full pb-6">
      <PageHeader
        title="Admin"
        description="Private launch overview. Demo accounts are excluded."
        actions={
          <>
            <Badge variant="outline" className="gap-1.5">
              <ShieldCheck className="size-3" strokeWidth={1.8} />
              Private
            </Badge>
            <Button asChild variant="outline" size="sm">
              <a href="/admin/export">
                <Download className="size-3.5" strokeWidth={1.8} />
                Export signups
              </a>
            </Button>
          </>
        }
      />

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Total signups"
            value={totals.users}
            caption={`${totals.new7} in the last 7 days`}
            icon={Users}
            tone="bg-[#edf5fb] text-[#3d7da5] dark:bg-[#182730] dark:text-[#82b7d7]"
          />
          <StatCard
            label="Onboarded"
            value={totals.onboarded}
            caption={`${onboardingRate}% of signups`}
            icon={UserCheck}
            tone="bg-[#effaf4] text-[#2e8a61] dark:bg-[#1c3026] dark:text-[#7bc6a1]"
          />
          <StatCard
            label="Activated"
            value={appTotals.activeUsers}
            caption={`${activationRate}% added an application`}
            icon={Activity}
            tone="bg-[#f3eefb] text-[#7557b7] dark:bg-[#261f35] dark:text-[#b8a2e1]"
          />
          <StatCard
            label="Applications"
            value={appTotals.total}
            caption={`${appTotals.new7} added in the last 7 days`}
            icon={BriefcaseBusiness}
            tone="bg-[#fff6e8] text-[#b47b2c] dark:bg-[#302619] dark:text-[#dfb56e]"
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <h2 className="text-[13.5px] font-medium text-ink">New signups</h2>
                <p className="mt-0.5 text-[10.5px] text-ink-muted">Last 14 days</p>
              </div>
              <span className="text-[10.5px] tabular-nums text-ink-faint">
                {dailySignups.reduce((sum, day) => sum + day.count, 0)} total
              </span>
            </div>
            <div className="p-4 lg:p-5">
              <div className="flex h-[172px] items-end gap-1.5 sm:gap-2">
                {dailySignups.map((day, index) => {
                  const height = Math.max(4, (day.count / maxDaily) * 124);
                  const showLabel =
                    index === 0 || index === dailySignups.length - 1 || index % 2 === 0;
                  return (
                    <div key={day.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <span className="text-[9.5px] font-medium tabular-nums text-ink-muted">
                        {day.count || ""}
                      </span>
                      <div
                        className="w-full max-w-[46px] rounded-t-[4px] bg-[#1d2130] dark:bg-white/70"
                        style={{ height: `${height}px`, opacity: day.count ? 1 : 0.12 }}
                        title={`${day.label}: ${day.count} signup${day.count === 1 ? "" : "s"}`}
                      />
                      <span className="h-3 text-[9px] text-ink-faint">
                        {showLabel ? day.label : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[10px] text-ink-muted">
                <span>Signups per day</span>
                <span className="inline-flex items-center gap-1">
                  <ArrowUpRight className="size-2.5" />
                  {totals.new30} in the last 30 days
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[13.5px] font-medium text-ink">Activation funnel</h2>
              <p className="mt-0.5 text-[10.5px] text-ink-muted">From first signup to first application</p>
            </div>
            <div className="space-y-4 p-4">
              {funnel.map((step) => (
                <div key={step.label}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-medium text-ink-secondary">{step.label}</p>
                    <p className="text-[10.5px] tabular-nums text-ink-muted">
                      {step.value} <span className="text-ink-faint">({step.rate}%)</span>
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-subtle">
                    <div
                      className={`h-full rounded-full ${step.color}`}
                      style={{ width: `${Math.max(step.rate, step.value > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="border-t border-line pt-3 text-[10px] leading-relaxed text-ink-faint">
                Activation means at least one application exists in the workspace. It is the clearest early signal
                that someone found the product useful enough to start.
              </p>
            </div>
          </section>
        </div>

        <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div>
              <h2 className="text-[13.5px] font-medium text-ink">Signups</h2>
              <p className="mt-0.5 text-[10.5px] text-ink-muted">
                Newest first. Demo accounts are not included.
              </p>
            </div>
            <span className="text-[10.5px] text-ink-faint">
              {users.length === totals.users
                ? `${users.length} account${users.length === 1 ? "" : "s"}`
                : `Showing ${users.length} of ${totals.users}`}
            </span>
          </div>

          {users.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Users className="mx-auto size-5 text-ink-faint" strokeWidth={1.7} />
              <p className="mt-3 text-[12px] font-medium text-ink">No signups yet</p>
              <p className="mt-1 text-[10.5px] text-ink-muted">
                Accounts will appear here as soon as people create a workspace.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-surface-subtle/40 text-[9.5px] font-medium uppercase tracking-[0.09em] text-ink-faint">
                    <th className="px-4 py-2.5">Person</th>
                    <th className="px-4 py-2.5">Joined</th>
                    <th className="px-4 py-2.5">Onboarding</th>
                    <th className="px-4 py-2.5 text-right">Applications</th>
                    <th className="px-4 py-2.5">Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isAdmin = isAdminEmail(user.email);
                    return (
                      <tr key={user.id} className="border-b border-line last:border-0 hover:bg-surface-hover/40">
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-start gap-2.5">
                            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-[10px] font-medium text-ink-secondary">
                              {initialsFor(user.name)}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="truncate text-[11.5px] font-medium text-ink">{user.name}</p>
                                {isAdmin ? (
                                  <Badge variant="outline" className="px-1 py-0 text-[9px]">
                                    Admin
                                  </Badge>
                                ) : null}
                              </div>
                              <a
                                href={`mailto:${user.email}`}
                                className="mt-0.5 block truncate text-[10.5px] text-ink-muted underline-offset-2 hover:text-ink hover:underline"
                              >
                                {user.email}
                              </a>
                              {(user.targetRole || user.university) && (
                                <p className="mt-0.5 truncate text-[9.5px] text-ink-faint">
                                  {[user.targetRole, user.university].filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <p className="text-[10.5px] text-ink-secondary">{formatDate(user.createdAt)}</p>
                          <p className="mt-0.5 text-[9.5px] text-ink-faint">
                            {formatRelative(user.createdAt)}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Badge variant={user.onboardedAt ? "green" : "orange"}>
                            {user.onboardedAt ? "Complete" : "Pending"}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-[11.5px] font-medium tabular-nums text-ink-secondary">
                          {user.applicationCount}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <p className="text-[10.5px] text-ink-secondary">
                            {formatDate(user.lastActiveAt, "MMM d, yyyy")}
                          </p>
                          <p className="mt-0.5 text-[9.5px] text-ink-faint">
                            {formatRelative(user.lastActiveAt)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="px-1 text-[10px] leading-relaxed text-ink-faint">
          Signed in as {admin.email}. This page is restricted to admin accounts and is never indexed or cached.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  caption: string;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <div className="rounded-[10px] border border-line bg-surface-card p-3.5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-ink-muted">{label}</p>
        <span className={`grid size-6 shrink-0 place-items-center rounded-md ${tone}`}>
          <Icon className="size-3" strokeWidth={1.7} />
        </span>
      </div>
      <p className="mt-2 text-[29px] font-medium leading-none tracking-[-0.045em] text-ink">{value}</p>
      <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">{caption}</p>
    </div>
  );
}
