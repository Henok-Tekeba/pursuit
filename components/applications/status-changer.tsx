"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import type { ApplicationStatus } from "@/lib/db/schema";
import { STATUS_LABELS, STATUS_ORDER, STATUS_STYLES } from "@/lib/constants";
import { updateApplicationStatusAction } from "@/app/actions/applications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

export function StatusChanger({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [ghostOpen, setGhostOpen] = useState(false);

  const update = (next: ApplicationStatus) => {
    if (next === status) return;
    if (next === "ghosted") {
      setGhostOpen(true);
      return;
    }
    startTransition(async () => {
      const result = await updateApplicationStatusAction(applicationId, next);
      if (result.ok) {
        toast.success(result.message ?? "Status updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={pending}
            aria-label={`Change status, currently ${STATUS_LABELS[status]}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface-card px-2 text-[12px] shadow-[0_1px_1px_rgba(16,24,40,0.02)] transition-colors hover:border-line-strong disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : <StatusBadge status={status} withIcon={false} />}
            <ChevronDown className="size-2.5 text-ink-faint" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[340px] w-[190px] overflow-y-auto">
          {STATUS_ORDER.map((value) => (
            <DropdownMenuItem key={value} onSelect={() => update(value)}>
              <span className={cn("size-1.5 rounded-full", STATUS_STYLES[value].dot)} />
              {STATUS_LABELS[value]}
              {value === status && <span className="ml-auto text-[9.5px] text-ink-faint">Current</span>}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setGhostOpen(true)}>
            <UserRoundX />
            Mark as ghosted…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={ghostOpen} onOpenChange={setGhostOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Mark as ghosted?</DialogTitle>
            <DialogDescription>
              Ghosted is only ever applied by you, never automatically. Confirming records that the company
              has stopped responding after your follow-ups.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setGhostOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await updateApplicationStatusAction(applicationId, "ghosted");
                  if (result.ok) {
                    toast.success("Marked as ghosted.");
                    setGhostOpen(false);
                    router.refresh();
                  } else {
                    toast.error(result.error);
                  }
                })
              }
            >
              {pending ? "Updating…" : "Yes, mark as ghosted"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
