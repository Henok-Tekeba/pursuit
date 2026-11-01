"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  Globe,
  Loader2,
  NotebookPen,
  Search,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import type { ApplicationStatus } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { CompanyAvatar } from "@/components/company-avatar";
import { companyLogoUrl } from "@/lib/company-logos";
import { EmptyState } from "@/components/empty-state";
import { updateCompanyAction } from "@/app/actions/applications";
import { formatDate, percent } from "@/lib/utils";

export type CompanyView = {
  id: string;
  name: string;
  website: string | null;
  domain: string | null;
  notes: string | null;
  applicationCount: number;
  responseCount: number;
  activeCount: number;
  latestApplication: {
    id: string;
    position: string;
    status: ApplicationStatus;
    appliedAt: string;
  } | null;
};

export function CompaniesGrid({ companies }: { companies: CompanyView[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "applications" | "responses">("applications");
  const [editing, setEditing] = useState<CompanyView | null>(null);
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const list = companies.filter((company) => {
      if (!search) return true;
      return (
        company.name.toLowerCase().includes(search) ||
        (company.domain ?? "").toLowerCase().includes(search) ||
        (company.latestApplication?.position ?? "").toLowerCase().includes(search)
      );
    });
    return list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "responses") return b.responseCount - a.responseCount;
      return b.applicationCount - a.applicationCount;
    });
  }, [companies, query, sort]);

  const openEdit = (company: CompanyView) => {
    setEditing(company);
    setWebsite(company.website ?? "");
    setNotes(company.notes ?? "");
  };

  const save = () => {
    if (!editing) return;
    startTransition(async () => {
      const result = await updateCompanyAction({ id: editing.id, website, notes });
      if (result.ok) {
        toast.success("Company updated.");
        setEditing(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search companies…"
            className="h-8 w-[230px] rounded-lg border border-line bg-surface-card pl-8 pr-2.5 text-[12px] text-ink outline-none placeholder:text-ink-faint focus:border-[#cfcfd4]"
          />
        </div>
        <div className="flex items-center gap-2 text-[10.5px] text-ink-muted">
          <span>{filtered.length} companies</span>
          <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
            <SelectTrigger className="w-[162px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="applications">Most applications</SelectItem>
              <SelectItem value="responses">Most responses</SelectItem>
              <SelectItem value="name">Name A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={companies.length === 0 ? "No companies yet" : "No companies match"}
            description={
              companies.length === 0
                ? "Every application you create is grouped by company here, with a simple view of the relationship."
                : "Try a different search or clear the filter."
            }
            action={
              companies.length === 0 ? (
                <Button asChild size="sm">
                  <Link href="/applications/new">Create an application</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 min-[1150px]:grid-cols-3">
            {filtered.map((company) => {
              const responseRate = percent(company.responseCount, company.applicationCount);
              return (
                <article
                  key={company.id}
                  className="group rounded-[10px] border border-line bg-surface-card p-4 transition-shadow hover:shadow-card"
                >
                  <div className="flex items-start gap-2.5">
                    <CompanyAvatar name={company.name} logoUrl={companyLogoUrl(company.domain)} className="size-9" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate text-[13.5px] font-medium text-ink">{company.name}</h3>
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ink-faint transition-colors hover:text-ink"
                            aria-label={`${company.name} website`}
                          >
                            <Globe className="size-3" />
                          </a>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[10.5px] text-ink-muted">
                        {company.domain || "No website saved"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="iconXs"
                      onClick={() => openEdit(company)}
                      aria-label={`Edit ${company.name}`}
                    >
                      <NotebookPen className="size-3" />
                    </Button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-surface-subtle/40">
                    <Metric label="Applications" value={company.applicationCount} />
                    <Metric label="Responses" value={company.responseCount} />
                    <Metric label="Active" value={company.activeCount} />
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-ink-faint">
                      <span>Response rate</span>
                      <span className="font-medium text-ink-secondary">{responseRate}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-subtle">
                      <span
                        className="block h-full rounded-full bg-[#4d91c7]"
                        style={{ width: `${responseRate}%` }}
                      />
                    </div>
                  </div>

                  {company.latestApplication ? (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-line px-2.5 py-2">
                      <div className="min-w-0">
                        <Link
                          href={`/applications/${company.latestApplication.id}`}
                          className="block truncate text-[11px] font-medium text-ink hover:underline"
                        >
                          {company.latestApplication.position}
                        </Link>
                        <p className="mt-0.5 text-[10px] text-ink-faint">
                          Applied {formatDate(company.latestApplication.appliedAt)}
                        </p>
                      </div>
                      <StatusBadge status={company.latestApplication.status} withIcon={false} />
                    </div>
                  ) : (
                    <p className="mt-3 rounded-lg border border-dashed border-line px-2.5 py-2 text-[10.5px] text-ink-faint">
                      No applications at this company.
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <Button asChild variant="ghost" size="xs" className="text-ink-muted">
                      <Link href={`/applications?q=${encodeURIComponent(company.name)}`}>
                        View applications
                        <ArrowUpRight className="size-3" />
                      </Link>
                    </Button>
                    {company.notes && (
                      <span className="flex items-center gap-1 text-[10px] text-ink-faint">
                        <StickyNote className="size-2.5" />
                        Has note
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{editing?.name}</DialogTitle>
            <DialogDescription>Keep a company-level note for context across every application.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="company-website">Website</Label>
              <Input
                id="company-website"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://company.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-notes">Company notes</Label>
              <Textarea
                id="company-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Referrals, recruiter names, timeline context…"
                className="min-h-[110px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditing(null)} disabled={pending}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={pending}>
              {pending && <Loader2 className="size-3 animate-spin" />}
              {pending ? "Saving…" : "Save company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-2 py-2 text-center">
      <p className="text-[13.5px] font-medium leading-none text-ink">{value}</p>
      <p className="mt-1 text-[9.5px] text-ink-faint">{label}</p>
    </div>
  );
}
