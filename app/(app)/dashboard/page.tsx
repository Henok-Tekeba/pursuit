import type { Metadata } from "next";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData, getSettingsForUser } from "@/lib/queries/applications";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/refresh-button";
import { DashboardMetrics, StatusOverview, TodaysActions } from "@/components/dashboard/metrics";
import { RecentApplications } from "@/components/dashboard/recent-applications";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const [data, settings] = await Promise.all([
    getDashboardData(user.id),
    getSettingsForUser(user.id),
  ]);
  const intervals = (settings?.followUpIntervals ?? [5, 10, 17]).join(", ");
  const todayLabel = formatDate(new Date(), "EEEE, MMMM d");

  return (
    <div className="min-h-full pb-6">
      <PageHeader
        title="Dashboard"
        description={
          <span className="flex flex-wrap items-center gap-1.5">
            <RefreshButton label={`${todayLabel} · updated just now`} />
            {data.dueFollowUps.length > 0 ? (
              <>
                <span className="text-ink-faint">·</span>
                <span className="inline-flex items-center gap-1 text-[#b47b2c]">
                  <span className="size-1.5 rounded-full bg-[#e8a240]" />
                  {data.dueFollowUps.length} follow-up
                  {data.dueFollowUps.length === 1 ? "" : "s"} need attention
                </span>
              </>
            ) : (
              <>
                <span className="text-ink-faint">·</span>
                <span className="text-[#3a956b]">You&apos;re all caught up</span>
              </>
            )}
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
                <Plus className="size-3.5" strokeWidth={1.9} />
                New application
              </Link>
            </Button>
          </>
        }
      />

      <div className="p-4 lg:p-5">
        <div className="overflow-hidden rounded-[11px] border border-line bg-surface-card shadow-card">
          <DashboardMetrics data={data} />
          <div className="grid min-[1150px]:grid-cols-[minmax(0,1fr)_336px]">
            <RecentApplications items={data.recent} />
            <aside className="space-y-3 bg-[#fcfcfd] p-3 dark:bg-white/[0.012]">
              <TodaysActions data={data.dueFollowUps} upcomingCount={data.upcomingFollowUps.length} />
              <StatusOverview data={data} />
            </aside>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[10.5px] text-ink-faint">
          <p>
            Your applications are private to your account. Follow-up dates use your saved cadence of{" "}
            <span className="font-medium text-ink-muted">{intervals} days</span>.
          </p>
          <p className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-[#4aa47a]" />
            All changes save automatically
          </p>
        </div>
      </div>
    </div>
  );
}
