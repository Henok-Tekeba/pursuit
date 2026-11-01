"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Copy,
  ExternalLink,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import type { ApplicationStatus, EmailDirection, EmailKind } from "@/lib/db/schema";
import { EMAIL_KIND_LABELS } from "@/lib/constants";
import { cn, formatDate, formatDateWithTime, formatTime } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export type EmailInboxItem = {
  id: string;
  applicationId: string;
  companyName: string;
  position: string;
  direction: EmailDirection;
  kind: EmailKind;
  subject: string;
  body: string;
  occurredAt: string;
  fromEmail: string | null;
  toEmail: string | null;
  status: ApplicationStatus;
};

export function EmailsTable({ emails }: { emails: EmailInboxItem[] }) {
  const [selected, setSelected] = useState<EmailInboxItem | null>(null);

  if (emails.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="No emails in this view"
        description="Log an email from any application, or adjust your filters to see the conversation history."
      />
    );
  }

  return (
    <>
      <div className="divide-y divide-line min-[1150px]:hidden">
        {emails.map((email) => {
          const outbound = email.direction === "outbound";
          return (
            <button
              key={email.id}
              type="button"
              onClick={() => setSelected(email)}
              className="flex w-full items-start gap-2.5 py-3 text-left"
            >
              <span
                className={cn(
                  "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border",
                  outbound
                    ? "border-line bg-surface-subtle text-ink-secondary"
                    : "border-[#dcecf7] bg-[#f2f9fd] text-[#357ba9]",
                )}
              >
                {outbound ? <ArrowUpRight className="size-3" /> : <ArrowDownLeft className="size-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-[12.5px] font-medium text-ink">{email.subject}</span>
                  <span className="rounded-[3px] border border-line bg-surface-subtle px-1 py-0.5 text-[9.5px] text-ink-muted">
                    {EMAIL_KIND_LABELS[email.kind]}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[10.5px] text-ink-muted">
                  {email.companyName} · {email.position}
                </span>
                <span className="mt-1 block text-[10px] text-ink-faint">
                  {outbound ? "Sent" : "Received"} · {formatDateWithTime(email.occurredAt)}
                </span>
              </span>
              <ChevronRight className="mt-1 size-3 shrink-0 text-ink-faint" />
            </button>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto min-[1150px]:block">
        <table className="w-full min-w-[700px] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-[#f8f9fb] dark:bg-white/[0.035]">
              <th className="w-[90px] py-2.5 pl-3 pr-2 text-[11px] font-medium text-ink-muted">Direction</th>
              <th className="px-2 py-2.5 text-[11px] font-medium text-ink-muted">Subject</th>
              <th className="px-2 py-2.5 text-[11px] font-medium text-ink-muted">Company</th>
              <th className="w-[110px] px-2 py-2.5 text-[11px] font-medium text-ink-muted">Type</th>
              <th className="w-[148px] px-2 py-2.5 text-[11px] font-medium text-ink-muted">Date</th>
              <th className="w-[50px] py-2.5 pl-2 pr-3 text-right text-[11px] font-medium text-ink-muted" />
            </tr>
          </thead>
          <tbody>
            {emails.map((email) => {
              const outbound = email.direction === "outbound";
              return (
                <tr key={email.id} className="group">
                  <td className="border-b border-line py-3 pl-3 pr-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-[3px] text-[10.5px] font-medium",
                        outbound
                          ? "border-line bg-surface-subtle text-ink-secondary"
                          : "border-[#dcecf7] bg-[#f2f9fd] text-[#357ba9]",
                      )}
                    >
                      {outbound ? <ArrowUpRight className="size-2.5" /> : <ArrowDownLeft className="size-2.5" />}
                      {outbound ? "Sent" : "Received"}
                    </span>
                  </td>
                  <td className="border-b border-line px-2 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(email)}
                      className="block max-w-[330px] truncate text-left text-[12.5px] font-medium text-ink hover:underline"
                    >
                      {email.subject}
                    </button>
                    <p className="mt-0.5 line-clamp-1 max-w-[360px] text-[10.5px] text-ink-muted">
                      {email.body.replace(/\s+/g, " ")}
                    </p>
                  </td>
                  <td className="border-b border-line px-2 py-3">
                    <Link
                      href={`/applications/${email.applicationId}`}
                      className="flex items-center gap-2"
                    >
                      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line bg-surface-subtle text-[10px] font-medium text-ink-secondary">
                        {email.companyName.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[11.5px] font-medium text-ink">{email.companyName}</span>
                        <span className="block truncate text-[10px] text-ink-muted">{email.position}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="border-b border-line px-2 py-3">
                    <span className="inline-flex rounded-[4px] border border-line bg-surface-subtle px-1.5 py-1 text-[10px] text-ink-secondary">
                      {EMAIL_KIND_LABELS[email.kind]}
                    </span>
                  </td>
                  <td className="border-b border-line px-2 py-3">
                    <span className="block whitespace-nowrap text-[12px] text-ink-secondary">{formatDate(email.occurredAt)}</span>
                    <span className="mt-0.5 block text-[10.5px] text-ink-faint">{formatTime(email.occurredAt)}</span>
                  </td>
                  <td className="border-b border-line py-3 pl-2 pr-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(email)}
                      className="grid size-7 place-items-center rounded-md border border-line bg-surface-card text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
                      aria-label="Open email"
                    >
                      <ChevronRight className="size-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[520px]">
          {selected && (
            <>
              <SheetHeader className="border-b border-line pb-4">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-1 text-[10px] font-medium",
                      selected.direction === "outbound"
                        ? "border-line bg-surface-subtle text-ink-secondary"
                        : "border-[#dcecf7] bg-[#f2f9fd] text-[#357ba9]",
                    )}
                  >
                    {selected.direction === "outbound" ? (
                      <ArrowUpRight className="size-2.5" />
                    ) : (
                      <ArrowDownLeft className="size-2.5" />
                    )}
                    {selected.direction === "outbound" ? "Sent" : "Received"}
                  </span>
                  <span className="inline-flex rounded-[4px] border border-line bg-surface-subtle px-1.5 py-1 text-[10px] text-ink-secondary">
                    {EMAIL_KIND_LABELS[selected.kind]}
                  </span>
                  <StatusBadge status={selected.status} className="ml-auto" />
                </div>
                <SheetTitle className="pr-6 text-[16.5px] leading-snug">{selected.subject}</SheetTitle>
                <SheetDescription>
                  {formatDateWithTime(selected.occurredAt)} · {selected.companyName} · {selected.position}
                </SheetDescription>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
                <dl className="grid grid-cols-[68px_1fr] gap-y-2 border-b border-line pb-4 text-[11.5px]">
                  <dt className="text-ink-muted">From</dt>
                  <dd className="truncate text-ink-secondary">{selected.fromEmail ?? "—"}</dd>
                  <dt className="text-ink-muted">To</dt>
                  <dd className="truncate text-ink-secondary">{selected.toEmail ?? "—"}</dd>
                </dl>
                <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-ink-secondary">
                  {selected.body}
                </pre>
              </div>
              <div className="flex items-center gap-2 border-t border-line p-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `Subject: ${selected.subject}\n\n${selected.body}`,
                      );
                      toast.success("Email copied.");
                    } catch {
                      toast.error("Couldn't copy the email.");
                    }
                  }}
                >
                  <Copy className="size-3.5" />
                  Copy
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/applications/${selected.applicationId}`}>
                    Open application
                    <ExternalLink className="size-3" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
