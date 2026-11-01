"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scheduleFollowUpAction } from "@/app/actions/applications";

export function ScheduleFollowUpDialog({
  applicationId,
  currentDate,
  triggerLabel = "Schedule follow-up",
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerClassName,
}: {
  applicationId: string;
  currentDate: string | null;
  triggerLabel?: string;
  triggerVariant?: "outline" | "ghost" | "default";
  triggerSize?: "xs" | "sm" | "default";
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(
    currentDate ?? format(addDays(new Date(), 3), "yyyy-MM-dd"),
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) setDate(currentDate ?? format(addDays(new Date(), 3), "yyyy-MM-dd"));
  }, [open, currentDate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className={triggerClassName}>
          <CalendarClock className="size-3.5" strokeWidth={1.8} />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Schedule a follow-up</DialogTitle>
          <DialogDescription>
            Set the date this application should resurface. It will appear in Follow-ups and Today&apos;s
            action items when it comes due.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-1">
          <Label htmlFor="schedule-date">Follow-up date</Label>
          <Input
            id="schedule-date"
            type="date"
            value={date}
            min={format(new Date(), "yyyy-MM-dd")}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={pending || !date}
            onClick={() =>
              startTransition(async () => {
                const result = await scheduleFollowUpAction(applicationId, date);
                if (result.ok) {
                  toast.success("Follow-up scheduled.");
                  setOpen(false);
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            {pending && <Loader2 className="size-3 animate-spin" />}
            {pending ? "Saving…" : "Schedule follow-up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
