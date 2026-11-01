"use client";

import Link from "next/link";
import { AlarmClock, ArrowUpRight, Bell, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { getFollowUpLabel } from "@/lib/utils";
import type { DueFollowUp } from "./types";
import { cn } from "@/lib/utils";

export function NotificationsPopover({
  dueFollowUps,
  notificationCount,
}: {
  dueFollowUps: DueFollowUp[];
  notificationCount: number;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-lg border border-line bg-surface-card text-ink-secondary shadow-[0_1px_1px_rgba(16,24,40,0.02)] transition-colors hover:border-line-strong hover:text-ink"
          aria-label={`Notifications${notificationCount ? `, ${notificationCount} due` : ""}`}
        >
          <Bell className="size-4" strokeWidth={1.7} />
          {notificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full border border-surface-card bg-[#fe4a6d]" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[318px] p-0">
        <div className="flex items-center justify-between border-b border-line px-3.5 py-3">
          <div>
            <p className="text-[13.5px] font-medium text-ink">Notifications</p>
            <p className="mt-0.5 text-[11px] text-ink-muted">
              {notificationCount > 0
                ? `${notificationCount} follow-up${notificationCount === 1 ? "" : "s"} need attention`
                : "You're all caught up"}
            </p>
          </div>
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full",
              notificationCount > 0
                ? "bg-[#fff0f3] text-[#d94a63] dark:bg-[#3a2227]"
                : "bg-[#eef8f2] text-[#3a956b] dark:bg-[#20332a]",
            )}
          >
            {notificationCount > 0 ? <AlarmClock className="size-3" /> : <Check className="size-3" />}
          </span>
        </div>
        <div className="max-h-[280px] overflow-y-auto p-1.5">
          {dueFollowUps.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-8 text-center">
              <span className="grid size-8 place-items-center rounded-full bg-surface-subtle text-ink-muted">
                <Check className="size-3.5" />
              </span>
              <p className="mt-2 text-[12.5px] font-medium text-ink">Inbox zero, almost</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">
                No follow-ups due today. Use the time to send a fresh note.
              </p>
            </div>
          ) : (
            dueFollowUps.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                href={`/applications/${item.id}`}
                className="flex items-start gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-surface-hover"
              >
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-[#fff4e7] text-[#c1842c] dark:bg-[#352c1d]">
                  <AlarmClock className="size-3" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-ink">
                    {item.companyName}
                  </span>
                  <span className="block truncate text-[11px] text-ink-muted">{item.position}</span>
                </span>
                <span className="pt-0.5 text-[10.5px] font-medium text-[#c1842c]">
                  {getFollowUpLabel(item.nextFollowUpAt)}
                </span>
              </Link>
            ))
          )}
        </div>
        <div className="border-t border-line p-1.5">
          <Button asChild variant="ghost" size="sm" className="w-full justify-between text-[12px]">
            <Link href="/follow-ups">
              Review follow-ups
              <ArrowUpRight className="size-3" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
