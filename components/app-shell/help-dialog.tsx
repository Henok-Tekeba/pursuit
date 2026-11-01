"use client";

import { Command, Compass, LifeBuoy, Keyboard, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogoMark } from "@/components/logo";

export function HelpCenterDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const shortcuts = [
    { label: "Open search", keys: ["⌘", "K"] },
    { label: "Create application", keys: ["⌘", "N"] },
    { label: "Go to dashboard", keys: ["G", "D"] },
    { label: "Go to applications", keys: ["G", "A"] },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-ink text-surface-card">
            <LogoMark className="size-5 text-surface-card" />
          </div>
          <DialogTitle>Help center</DialogTitle>
          <DialogDescription>
            A calmer way to run your internship search. Here&apos;s what you need to know.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-subtle/60 p-3">
            <div>
              <p className="text-[13px] font-medium text-ink">Take the quick tour</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-muted">
                A 60-second walkthrough of the dashboard, applications, and follow-ups.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                window.location.href = "/dashboard?tour=1";
              }}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-ink px-3 text-[11px] font-medium text-surface-card transition-opacity hover:opacity-85"
            >
              <Compass className="size-3" />
              Start
            </button>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-line bg-surface-subtle/60 p-3">
            <Keyboard className="mt-0.5 size-4 text-ink-muted" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-ink">Keyboard shortcuts</p>
              <div className="mt-2 space-y-1.5">
                {shortcuts.map((shortcut) => (
                  <div key={shortcut.label} className="flex items-center justify-between text-[12px] text-ink-muted">
                    <span>{shortcut.label}</span>
                    <span className="flex items-center gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
                          className="inline-flex h-[19px] min-w-[19px] items-center justify-center rounded border border-line bg-surface-card px-1 font-sans text-[10.5px] text-ink-secondary"
                        >
                          {key}
                        </kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-line p-3">
            <LifeBuoy className="mt-0.5 size-4 text-ink-muted" />
            <div>
              <p className="text-[13px] font-medium text-ink">Need a hand?</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                Email us and we&apos;ll get back to you within one business day.
              </p>
              <a
                href="mailto:hello@pursuit.app"
                className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink underline underline-offset-2"
              >
                <Mail className="size-3" />
                hello@pursuit.app
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-surface-subtle px-3 py-2 text-[11.5px] text-ink-muted">
            <Command className="size-3" />
            Tip: press <span className="font-medium text-ink-secondary">⌘ K</span> from anywhere to jump to an application.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
