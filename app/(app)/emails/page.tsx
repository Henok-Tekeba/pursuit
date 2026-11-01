import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, FileText, Mail, Plus, Search, X } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getEmailsForUser } from "@/lib/queries/applications";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmailsTable } from "@/components/emails/emails-table";
import { EMAIL_KIND_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Emails" };
export const dynamic = "force-dynamic";

const kindOptions = Object.entries(EMAIL_KIND_LABELS);

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; direction?: string; kind?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const query = (params.q ?? "").slice(0, 120);
  const direction = ["outbound", "inbound"].includes(params.direction ?? "")
    ? params.direction!
    : "all";
  const kind = Object.keys(EMAIL_KIND_LABELS).includes(params.kind ?? "") ? params.kind! : "all";

  const [emails, allEmails] = await Promise.all([
    getEmailsForUser(user.id, { query, direction, kind }),
    getEmailsForUser(user.id, {}),
  ]);
  const inbound = allEmails.filter((email) => email.direction === "inbound").length;
  const followUps = allEmails.filter((email) => email.kind === "follow_up").length;

  return (
    <div className="min-h-full pb-6">
      <PageHeader
        title="Emails"
        description={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <Mail className="size-2.5 text-[#5b8def]" />
            {allEmails.length} emails preserved
            <span className="text-ink-faint">·</span>
            <span className="text-[#357ba9]">{inbound} replies received</span>
            <span className="text-ink-faint">·</span>
            {followUps} follow-ups sent
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/templates">
                <FileText className="size-3.5" />
                Templates
              </Link>
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
          <form action="/emails" method="get" className="flex flex-wrap items-center gap-2 border-b border-line p-4">
            <div className="relative min-w-[200px] flex-1 sm:max-w-[280px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search subject, body, company…"
                className="h-8 w-full rounded-lg border border-line bg-surface-card pl-8 pr-8 text-[12px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-[#cfcfd4] focus:ring-2 focus:ring-black/[0.03]"
              />
              {query && (
                <Link
                  href="/emails"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
                  aria-label="Clear search"
                >
                  <X className="size-3" />
                </Link>
              )}
            </div>
            <select
              name="direction"
              defaultValue={direction}
              className="h-8 rounded-lg border border-line bg-surface-card px-2 text-[12px] text-ink-secondary outline-none focus:border-[#cfcfd4]"
            >
              <option value="all">All directions</option>
              <option value="outbound">Sent</option>
              <option value="inbound">Received</option>
            </select>
            <select
              name="kind"
              defaultValue={kind}
              className="h-8 max-w-[160px] rounded-lg border border-line bg-surface-card px-2 text-[12px] text-ink-secondary outline-none focus:border-[#cfcfd4]"
            >
              <option value="all">All types</option>
              {kindOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" size="sm">
              Filter
            </Button>
            <div className="ml-auto flex items-center gap-3 text-[10.5px] text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-ink" />
                {emails.length} shown
              </span>
              <span className="flex items-center gap-1">
                <ArrowUpRight className="size-3" />
                {emails.filter((email) => email.direction === "outbound").length} sent
              </span>
              <span className="flex items-center gap-1">
                <ArrowDownLeft className="size-3" />
                {emails.filter((email) => email.direction === "inbound").length} received
              </span>
            </div>
          </form>

          <div className="p-4 lg:p-5">
            <EmailsTable emails={emails} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[10.5px] text-ink-faint">
            <span>Showing the latest 60 email interactions. Full history lives on each application.</span>
            <Link href="/templates" className="inline-flex items-center gap-1 hover:text-ink hover:underline">
              <FileText className="size-3" />
              Reusable templates
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
