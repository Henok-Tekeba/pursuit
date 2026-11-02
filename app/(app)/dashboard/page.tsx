import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData, getSettingsForUser } from "@/lib/queries/applications";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/refresh-button";
import { DashboardMetrics, StatusOverview, TodaysActions } from "@/components/dashboard/metrics";
import { RecentApplications } from "@/components/dashboard/recent-applications";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const todayLabel = formatDate(new Date(), "EEEE, MMMM d");

  return (
    <div className="min-h-full pb-6">
      <PageHeader
        title="Dashboard"
        description={
          <span className="flex flex-wrap items-center gap-1.5">
            <RefreshButton label={`${todayLabel} · updated just now`} />
            <span className="text-ink-faint">·</span>
            <span>Your search at a glance</span>
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

      <Suspense fallback={<DashboardContentSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const user = await requireUser();
  const [data, settings] = await Promise.all([
    getDashboardData(user.id),
    getSettingsForUser(user.id),
  ]);
  const intervals = (settings?.followUpIntervals ?? [5, 10, 17]).join(", ");

  return (
    <>
      <div className="p-4 lg:p-5">
        <div className="overflow-hidden rounded-[11px] border border-line bg-surface-card shadow-card">
          <DashboardMetrics data={data} />
          <div className="grid min-[1150px]:grid-cols-[minmax(0,1fr)_336px]">
            <RecentApplications items={data.recent} />
            <aside className="space-y-3 bg-[#faf5eb] p-3 dark:bg-white/[0.012]">
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
    </>
  );
}

function DashboardContentSkeleton() {
  return (
    <div className="p-4 lg:p-5">
      <div className="overflow-hidden rounded-[11px] border border-line bg-surface-card">
        <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="border-b border-line p-4 lg:border-b-0 lg:border-r">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="mt-3 h-7 w-12" />
              <Skeleton className="mt-2 h-2 w-32" />
            </div>
          ))}
        </div>
        <div className="border-t border-line p-4">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
