import Link from "next/link";
import { ArrowUpRight, Briefcase } from "lucide-react";
import type { DashboardData } from "@/lib/queries/applications";
import { CompanyAvatar } from "@/components/company-avatar";
import { companyLogoUrl } from "@/lib/company-logos";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, getFollowUpLabel, isOverdue } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export function RecentApplications({ items }: { items: DashboardData["recent"] }) {
  return (
    <section
      data-tour="recent-applications"
      className="min-w-0 border-b border-line min-[1150px]:border-b-0 min-[1150px]:border-r"
    >
      <div className="flex items-center justify-between px-4 py-3.5">
        <div>
          <h2 className="text-[14px] font-medium tracking-[-0.01em] text-ink">Recent applications</h2>
          <p className="mt-0.5 text-[11px] text-ink-muted">The latest conversations in your pipeline</p>
        </div>
        <Button asChild variant="ghost" size="xs" className="text-ink-muted">
          <Link href="/applications">
            View all
            <ArrowUpRight className="size-3" />
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No applications yet"
          description="Create your first application and every follow-up will be tracked from here."
          compact
          action={
            <Button asChild size="xs">
              <Link href="/applications/new">Add application</Link>
            </Button>
          }
        />
      ) : (
        <>
        <div className="divide-y divide-line sm:hidden">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/applications/${item.id}`}
              className="flex items-center gap-2.5 px-4 py-3 transition-colors hover:bg-surface-hover"
            >
              <CompanyAvatar
                name={item.companyName}
                logoUrl={companyLogoUrl(item.companyDomain)}
                className="size-8"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-ink">{item.companyName}</p>
                <p className="mt-0.5 truncate text-[10.5px] text-ink-muted">{item.position}</p>
                <p className="mt-1 text-[10px] text-ink-faint">
                  {formatDate(item.appliedAt)}
                  {item.nextFollowUpAt && (
                    <>
                      {" · "}
                      <span className={isOverdue(item.nextFollowUpAt) ? "text-[#c1842c]" : ""}>
                        {getFollowUpLabel(item.nextFollowUpAt)}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </Link>
          ))}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[470px] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-[#f8f9fb] dark:bg-white/[0.035]">
                <th className="py-2 pl-4 pr-2 text-[11px] font-medium text-ink-muted">Company</th>
                <th className="py-2 px-2 text-[11px] font-medium text-ink-muted">Applied</th>
                <th className="py-2 px-2 text-[11px] font-medium text-ink-muted">Status</th>
                <th className="py-2 pl-2 pr-4 text-right text-[11px] font-medium text-ink-muted">Open</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="group transition-colors hover:bg-surface-hover">
                  <td className="border-b border-line py-2.5 pl-4 pr-2">
                    <Link href={`/applications/${item.id}`} className="flex items-center gap-2.5">
                      <CompanyAvatar
                        name={item.companyName}
                        logoUrl={companyLogoUrl(item.companyDomain)}
                        className="size-7"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-medium leading-tight text-ink">
                          {item.companyName}
                        </span>
                        <span className="mt-0.5 block truncate text-[10.5px] leading-tight text-ink-muted">
                          {item.position}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="border-b border-line px-2 py-2.5">
                    <span className="block text-[11.5px] leading-tight text-ink-secondary">
                      {formatDate(item.appliedAt)}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-tight text-ink-faint">
                      {item.nextFollowUpAt
                        ? isOverdue(item.nextFollowUpAt)
                          ? <span className="text-[#c1842c]">{getFollowUpLabel(item.nextFollowUpAt)}</span>
                          : getFollowUpLabel(item.nextFollowUpAt)
                        : "No follow-up"}
                    </span>
                  </td>
                  <td className="border-b border-line px-2 py-2.5">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="border-b border-line py-2.5 pl-2 pr-4 text-right">
                    <Link
                      href={`/applications/${item.id}`}
                      className="inline-flex size-6 items-center justify-center rounded-md text-ink-faint transition-colors group-hover:bg-surface-card group-hover:text-ink"
                      aria-label={`Open ${item.companyName}`}
                    >
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
}
