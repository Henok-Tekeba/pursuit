"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Funnel, ListFilter, Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { METHOD_LABELS, METHOD_ORDER, STATUS_LABELS, STATUS_ORDER } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type FilterValues = {
  query: string;
  status: string;
  method: string;
  range: string;
  sort: string;
  followUp: string;
};

export function ApplicationFilters({ values }: { values: FilterValues }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(values.query);
  const isFirst = useRef(true);

  useEffect(() => {
    setSearch(values.query);
  }, [values.query]);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (search === values.query) return;
    const timer = setTimeout(() => {
      updateParam("q", search.trim() || null);
    }, 320);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function updateParam(key: string, value: string | null, replace = false) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    const query = params.toString();
    const href = `${pathname}${query ? `?${query}` : ""}`;
    if (replace) router.replace(href, { scroll: false });
    else router.push(href, { scroll: false });
  }

  const activeFilterCount = [
    values.status !== "all",
    values.method !== "all",
    values.range !== "all",
    values.sort !== "applied_desc",
    values.followUp !== "all",
  ].filter(Boolean).length;

  const followUpParams = new URLSearchParams(searchParams.toString());
  if (values.followUp === "due") followUpParams.delete("followUp");
  else followUpParams.set("followUp", "due");
  followUpParams.delete("page");
  const followUpHref = `${pathname}${followUpParams.toString() ? `?${followUpParams.toString()}` : ""}`;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-[196px] sm:flex-none">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search applications…"
          aria-label="Search applications"
          className="h-9 w-full rounded-lg border border-line bg-surface-card pl-8 pr-8 text-[12px] text-ink shadow-[0_1px_1px_rgba(16,24,40,0.02)] outline-none transition-colors placeholder:text-ink-faint focus:border-[#cfcfd4] focus:ring-2 focus:ring-black/[0.03] sm:w-[196px]"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
            aria-label="Clear search"
          >
            <X className="size-3" />
          </button>
        ) : null}
      </div>

      <div className="grid w-full grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-1.5">
        <Select value={values.range} onValueChange={(value) => updateParam("range", value)}>
          <SelectTrigger className="w-full sm:w-[110px]" aria-label="Filter by date">
            <span className="shrink-0 text-ink-faint">Date:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={values.status} onValueChange={(value) => updateParam("status", value)}>
          <SelectTrigger className="w-full sm:w-[124px]" aria-label="Filter by status">
            <span className="shrink-0 text-ink-faint">Status:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[320px]">
            <SelectItem value="all">All</SelectItem>
            {STATUS_ORDER.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={values.method} onValueChange={(value) => updateParam("method", value)}>
          <SelectTrigger className="w-full sm:w-[130px]" aria-label="Filter by method">
            <span className="shrink-0 text-ink-faint">Method:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {METHOD_ORDER.map((method) => (
              <SelectItem key={method} value={method}>
                {METHOD_LABELS[method]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={values.sort} onValueChange={(value) => updateParam("sort", value)}>
          <SelectTrigger className="w-full sm:w-[140px]" aria-label="Sort applications">
            <span className="shrink-0 text-ink-faint">Sort:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="applied_desc">Newest</SelectItem>
            <SelectItem value="applied_asc">Oldest</SelectItem>
            <SelectItem value="company_asc">A to Z</SelectItem>
            <SelectItem value="company_desc">Z to A</SelectItem>
            <SelectItem value="follow_up">Follow-up</SelectItem>
          </SelectContent>
        </Select>

        <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1 sm:ml-1">
        <a
          href={pathname}
          onClick={() => setSearch("")}
          className={cn(
            "relative grid size-9 place-items-center rounded-lg border border-line bg-surface-card text-ink-muted shadow-[0_1px_1px_rgba(16,24,40,0.02)] transition-colors hover:border-line-strong hover:text-ink",
            activeFilterCount === 0 && !search && "opacity-55",
          )}
          title="Reset filters"
          aria-label="Reset filters"
        >
          <ListFilter className="size-3.5" strokeWidth={1.7} />
        </a>
        <a
          href={followUpHref}
          className={cn(
            "relative grid size-9 place-items-center rounded-lg border shadow-[0_1px_1px_rgba(16,24,40,0.02)] transition-colors",
            values.followUp === "due"
              ? "border-ink bg-ink text-surface-card"
              : "border-line bg-surface-card text-ink-muted hover:border-line-strong hover:text-ink",
          )}
          title="Show only follow-ups due"
          aria-label="Show only follow-ups due"
          aria-pressed={values.followUp === "due"}
        >
          <Funnel className="size-3.5" strokeWidth={1.7} />
          {values.followUp === "due" && (
            <span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-[#fe4a6d]" />
          )}
        </a>
        </div>
      </div>
    </div>
  );
}
