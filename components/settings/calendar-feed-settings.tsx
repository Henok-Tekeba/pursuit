"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { GoogleCalendarIcon } from "@/components/auth/social-icons";
import { toast } from "sonner";
import { regenerateCalendarFeedAction } from "@/app/actions/calendar";
import { Button } from "@/components/ui/button";

export function CalendarFeedSettings({
  feedUrl,
  nextEventUrl,
  nextEventCompany,
}: {
  feedUrl: string;
  nextEventUrl: string | null;
  nextEventCompany: string | null;
}) {
  const router = useRouter();
  const [currentFeedUrl, setCurrentFeedUrl] = useState(feedUrl);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentFeedUrl);
      setCopied(true);
      toast.success("Calendar link copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy the link from the field instead.");
    }
  };

  const regenerate = () => {
    startTransition(async () => {
      const result = await regenerateCalendarFeedAction();
      if (!result.ok) {
        toast.error(result.message ?? "Could not regenerate the calendar link.");
        return;
      }
      if (result.feedUrl) setCurrentFeedUrl(result.feedUrl);
      toast.success("Calendar link regenerated. The old link no longer works.");
      router.refresh();
    });
  };

  return (
    <section id="calendar-feed" className="scroll-mt-6 rounded-[10px] border border-line bg-surface-card shadow-card">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <CalendarDays className="size-3.5 text-ink-muted" />
        <div>
          <h2 className="text-[13.5px] font-medium text-ink">Calendar feed</h2>
          <p className="mt-0.5 text-[10.5px] text-ink-muted">
            Follow-ups and reminders outside Pursuit.
          </p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-[11.5px] leading-[1.6] text-ink-secondary">
          Add the next follow-up as a Google Calendar event, or subscribe to the private feed to keep
          every follow-up in sync across Google Calendar, Apple Calendar, or Outlook.
        </p>

        {nextEventUrl ? (
          <Button asChild size="sm" className="h-auto min-h-9 w-full whitespace-normal py-2 text-center">
            <a href={nextEventUrl} target="_blank" rel="noreferrer">
              <GoogleCalendarIcon className="size-4" />
              Add {nextEventCompany ?? "next"} follow-up to Google Calendar
            </a>
          </Button>
        ) : (
          <p className="rounded-[8px] border border-dashed border-line bg-surface-subtle/40 px-3 py-2.5 text-[10.5px] text-ink-muted">
            No scheduled follow-ups to add yet. New follow-ups will appear here.
          </p>
        )}

        <div className="flex items-center gap-2">
          <input
            readOnly
            value={currentFeedUrl}
            aria-label="Private calendar feed URL"
            className="h-9 min-w-0 flex-1 truncate rounded-[7px] border border-line bg-surface-subtle/50 px-2.5 text-[10.5px] text-ink-secondary outline-none"
          />
          <Button type="button" variant="outline" size="sm" onClick={copy} className="shrink-0">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <p className="text-[10px] text-ink-faint">
          The button adds one event now. The feed below keeps all follow-ups updated automatically.
        </p>

        <div className="flex items-start justify-between gap-4 rounded-[8px] border border-line bg-surface-subtle/40 p-3">
          <p className="text-[10.5px] leading-[1.55] text-ink-muted">
            Only open applications with a scheduled follow-up and no recorded reply are included.
            Logging a reply or closing an application removes its event on the next refresh.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={regenerate}
            disabled={pending}
            className="shrink-0 text-ink-muted"
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
            Regenerate
          </Button>
        </div>

        <p className="text-[10px] leading-[1.55] text-ink-faint">
          Keep this link private. Regenerating it revokes the old feed.
        </p>
      </div>
    </section>
  );
}
