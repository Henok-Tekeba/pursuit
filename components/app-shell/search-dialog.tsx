"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlarmClock,
  ArrowRight,
  BarChart3,
  Briefcase,
  FileText,
  Loader2,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import type { ApplicationStatus } from "@/lib/db/schema";
import type { SearchResult } from "./types";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { href: "/applications/new", label: "New application", icon: Plus, hint: "Create" },
  { href: "/follow-ups", label: "Follow-ups due", icon: AlarmClock, hint: "Review" },
  { href: "/templates", label: "Email templates", icon: FileText, hint: "Manage" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, hint: "View" },
];

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n" && !open) {
        event.preventDefault();
        router.push("/applications/new");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open, router]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = ++requestId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Search failed");
        const data = (await response.json()) as { results: SearchResult[] };
        if (id === requestId.current) {
          setResults(data.results);
          setActiveIndex(0);
        }
      } catch {
        if (id === requestId.current) setResults([]);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, query ? 180 : 0);
    return () => clearTimeout(timer);
  }, [query, open]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter") {
      if (results[activeIndex]) {
        event.preventDefault();
        go(`/applications/${results[activeIndex].id}`);
      } else if (!query && QUICK_LINKS[0]) {
        event.preventDefault();
        go(QUICK_LINKS[0].href);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="top-[14%] max-w-[560px] translate-y-0 gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">Search applications</DialogTitle>
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-ink-muted" />
          ) : (
            <Search className="size-4 shrink-0 text-ink-muted" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search applications, companies, people…"
            className="h-12 w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
          />
          <kbd className="hidden rounded border border-line bg-surface-subtle px-1.5 py-0.5 text-[10.5px] text-ink-faint sm:block">
            esc
          </kbd>
        </div>

        <div className="max-h-[390px] overflow-y-auto p-1.5">
          {query.trim() ? (
            <>
              <p className="px-2.5 pb-1.5 pt-1 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                Applications
              </p>
              {results.length === 0 && !loading ? (
                <div className="px-3 py-8 text-center">
                  <p className="text-[13px] font-medium text-ink">No matches for “{query}”</p>
                  <p className="mt-1 text-[11.5px] text-ink-muted">
                    Try a company, role, or contact name.
                  </p>
                </div>
              ) : (
                results.map((result, index) => (
                  <button
                    key={result.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(`/applications/${result.id}`)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                      activeIndex === index ? "bg-surface-hover" : "hover:bg-surface-hover",
                    )}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line bg-surface-subtle text-[10.5px] font-medium text-ink-secondary">
                      {result.companyName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {result.companyName}
                      </span>
                      <span className="block truncate text-[11px] text-ink-muted">
                        {result.position}
                        {result.contactName ? ` · ${result.contactName}` : ""}
                      </span>
                    </span>
                    <span className="text-[10px] font-medium text-ink-faint">{result.reference}</span>
                    <StatusBadge
                      status={result.status as ApplicationStatus}
                      withIcon={false}
                      className="hidden sm:inline-flex"
                    />
                    <ArrowRight className="size-3 text-ink-faint" />
                  </button>
                ))
              )}
            </>
          ) : (
            <>
              <p className="px-2.5 pb-1.5 pt-1 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                Jump to
              </p>
              <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                {QUICK_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.href}
                      type="button"
                      onClick={() => go(link.href)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-hover"
                    >
                      <span className="grid size-7 place-items-center rounded-md border border-line bg-surface-card text-ink-secondary">
                        <Icon className="size-3.5" strokeWidth={1.7} />
                      </span>
                      <span className="text-[12.5px] text-ink">{link.label}</span>
                      <span className="ml-auto text-[10px] uppercase tracking-wider text-ink-faint">
                        {link.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="px-2.5 pb-1.5 pt-3 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                Recent applications
              </p>
              {results.slice(0, 5).map((result, index) => (
                <button
                  key={result.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => go(`/applications/${result.id}`)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                    activeIndex === index ? "bg-surface-hover" : "hover:bg-surface-hover",
                  )}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line bg-surface-subtle text-[10.5px] font-medium text-ink-secondary">
                    {result.companyName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {result.companyName}
                    </span>
                    <span className="block truncate text-[11px] text-ink-muted">{result.position}</span>
                  </span>
                  <StatusBadge status={result.status as ApplicationStatus} withIcon={false} />
                </button>
              ))}
              {results.length === 0 && !loading && (
                <div className="flex items-center gap-2 px-3 py-6 text-[12px] text-ink-muted">
                  <Sparkles className="size-3.5" />
                  Add your first application to start searching.
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-line bg-surface-subtle/60 px-3 py-2 text-[10.5px] text-ink-faint">
          <span className="flex items-center gap-1.5">
            <Briefcase className="size-3" />
            Search across your private workspace
          </span>
          <span className="flex items-center gap-2">
            <span>↑↓ to navigate</span>
            <span>↵ to open</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
