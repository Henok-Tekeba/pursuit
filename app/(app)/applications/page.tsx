import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Download, Plus, RefreshCw, SearchX } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getApplications, getDashboardData } from "@/lib/queries/applications";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ApplicationFilters } from "@/components/applications/application-filters";
import { ApplicationTable } from "@/components/applications/application-table";
import { EmptyState } from "@/components/empty-state";
import { METHOD_ORDER, STATUS_ORDER } from "@/lib/constants";

export const metadata: Metadata = { title: "Applications" };
export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
  method?: string;
  range?: string;
  sort?: string;
  followUp?: string;
  page?: string;
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const status = STATUS_ORDER.includes(params.status as never) ? params.status! : "all";
  const method = METHOD_ORDER.includes(params.method as never) ? params.method! : "all";
  const range = ["7d", "30d", "90d"].includes(params.range ?? "") ? params.range! : "all";
  const sort = ["applied_desc", "applied_asc", "company_asc", "company_desc", "follow_up"].includes(
    params.sort ?? "",
  )
    ? params.sort!
    : "applied_desc";
  const followUp = ["due", "upcoming"].includes(params.followUp ?? "") ? params.followUp! : "all";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const query = (params.q ?? "").slice(0, 120);

  const [result, dashboard] = await Promise.all([
    getApplications(user.id, {
      query,
      status,
      method,
      range,
      sort,
      followUp,
      page,
      pageSize: 10,
    }),
    getDashboardData(user.id),
  ]);

  const hasFilters =
    Boolean(query) || status !== "all" || method !== "all" || range !== "all" || followUp !== "all";

  return (
    <div className="min-h-full pb-6">
      <PageHeader
        title="Applications"
        description={
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="size-2.5 text-[#5b8def]" strokeWidth={2.2} />
            {dashboard.total} application{dashboard.total === 1 ? "" : "s"} tracked
            {dashboard.dueFollowUps.length > 0 && (
              <>
                <span className="text-ink-faint">·</span>
                <span className="text-[#b47b2c]">
                  {dashboard.dueFollowUps.length} follow-up{dashboard.dueFollowUps.length === 1 ? "" : "s"} due
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
        <div className="rounded-[11px] border border-line bg-surface-card p-4 shadow-card">
          <ApplicationFilters
            values={{
              query,
              status,
              method,
              range,
              sort,
              followUp,
            }}
          />

          {result.items.length === 0 ? (
            hasFilters ? (
              <EmptyState
                icon={SearchX}
                title="No applications match"
                description="Try a different keyword or clear the filters to see all of your applications."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/applications">Clear filters</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Briefcase}
                title="Your first application starts here"
                description="Track every cold email, referral, and job portal application in one place. Follow-ups and replies stay attached to the conversation."
                action={
                  <Button asChild size="sm">
                    <Link href="/applications/new">
                      <Plus className="size-3.5" />
                      Create application
                    </Link>
                  </Button>
                }
              />
            )
          ) : (
            <ApplicationTable
              items={result.items}
              pagination={{
                total: result.total,
                page: result.page,
                pageSize: result.pageSize,
                pageCount: result.pageCount,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
