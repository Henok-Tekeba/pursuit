"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clipboard,
  Copy,
  ExternalLink,
  Mail,
  MailOpen,
} from "lucide-react";
import { toast } from "sonner";
import type { EmailDirection, EmailKind } from "@/lib/db/schema";
import { EMAIL_KIND_LABELS } from "@/lib/constants";
import { cn, formatDateWithTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export type EmailRecord = {
  id: string;
  direction: EmailDirection;
  kind: EmailKind;
  subject: string;
  body: string;
  fromEmail: string | null;
  toEmail: string | null;
  occurredAt: string;
};

export function EmailHistory({
  emails,
  onCompose,
  onReply,
}: {
  emails: EmailRecord[];
  onCompose: () => void;
  onReply: () => void;
}) {
  if (emails.length === 0) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between rounded-lg border border-line bg-surface-subtle/50 px-3 py-2">
          <p className="text-[11px] text-ink-muted">
            Every outbound and inbound email is stored here, exactly as sent.
          </p>
          <Button size="xs" variant="outline" onClick={onCompose}>
            <Mail className="size-3" />
            Log email
          </Button>
        </div>
        <EmptyState
          icon={MailOpen}
          title="No emails recorded yet"
          description="Store the cold email, follow-ups, and replies here so the full conversation is never lost."
          action={
            <Button size="sm" onClick={onCompose}>
              <Mail className="size-3.5" />
              Log the first email
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-subtle/50 px-3 py-2">
        <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <Clipboard className="size-3" />
          Immutable copy of the conversation. Previous emails are never overwritten.
        </p>
        <div className="flex items-center gap-1.5">
          <Button size="xs" variant="ghost" onClick={onReply}>
            <ArrowDownLeft className="size-3" />
            Record reply
          </Button>
          <Button size="xs" variant="outline" onClick={onCompose}>
            <Mail className="size-3" />
            Log email
          </Button>
        </div>
      </div>
      <div className="space-y-2.5">
        {emails.map((email) => (
          <EmailCard key={email.id} email={email} />
        ))}
      </div>
    </div>
  );
}

function EmailCard({ email }: { email: EmailRecord }) {
  const [expanded, setExpanded] = useState(false);
  const outbound = email.direction === "outbound";
  const preview = email.body.replace(/\s+/g, " ").slice(0, 150);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
      toast.success("Email copied.");
    } catch {
      toast.error("Couldn't copy the email.");
    }
  };

  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border bg-surface-card",
        outbound ? "border-line" : "border-[#dcecf7] dark:border-[#284250]",
      )}
    >
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <span
          className={cn(
            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md",
            outbound
              ? "bg-[#f3f4f6] text-ink-secondary dark:bg-white/[0.06]"
              : "bg-[#eef8fe] text-[#357ba9] dark:bg-[#1a2d38]",
          )}
        >
          {outbound ? <ArrowUpRight className="size-3.5" /> : <ArrowDownLeft className="size-3.5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[12.5px] font-medium text-ink">{email.subject}</p>
            <span className="rounded-[3px] border border-line bg-surface-subtle px-1 py-0.5 text-[9.5px] font-medium text-ink-muted">
              {EMAIL_KIND_LABELS[email.kind]}
            </span>
          </div>
          <p className="mt-1 text-[10.5px] text-ink-faint">
            {outbound ? "To" : "From"} {outbound ? email.toEmail || "contact" : email.fromEmail || "contact"} ·{" "}
            {formatDateWithTime(email.occurredAt)}
          </p>
          {!expanded && (
            <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-ink-secondary">{preview}…</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={copy}
            className="grid size-6 place-items-center rounded-md text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
            aria-label="Copy email"
          >
            <Copy className="size-3" />
          </button>
          {outbound && email.toEmail && (
            <a
              href={`mailto:${email.toEmail}?subject=${encodeURIComponent(`Re: ${email.subject}`)}`}
              className="grid size-6 place-items-center rounded-md text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
              aria-label="Open in mail app"
            >
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-line bg-surface-subtle/30 px-3 py-3">
          <pre className="whitespace-pre-wrap break-words font-sans text-[12px] leading-relaxed text-ink-secondary">
            {email.body}
          </pre>
        </div>
      )}
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-center border-t border-line py-1.5 text-[10.5px] font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
      >
        {expanded ? "Hide full email" : "Show full email"}
      </button>
    </article>
  );
}
