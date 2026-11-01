"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlarmClock, CalendarCheck, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { logEmailAction } from "@/app/actions/applications";
import { getFollowUpLabel } from "@/lib/utils";

export function QuickFollowUp({
  application,
}: {
  application: {
    id: string;
    companyName: string;
    position: string;
    contactName: string | null;
    nextFollowUpAt: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const firstName = application.contactName?.split(" ")[0] ?? "there";
  const [subject, setSubject] = useState(
    `Re: ${application.position} at ${application.companyName}`,
  );
  const [body, setBody] = useState(
    `Hi ${firstName},\n\nI wanted to gently follow up on my application for the ${application.position} role at ${application.companyName}. I remain very interested and would be glad to share anything else that would be helpful.\n\nBest,\n`,
  );

  const submit = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and message before logging.");
      return;
    }
    startTransition(async () => {
      const result = await logEmailAction({
        applicationId: application.id,
        direction: "outbound",
        kind: "follow_up",
        subject,
        body,
      });
      if (result.ok) {
        toast.success("Follow-up logged.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#b47b2c] transition-colors hover:text-[#8e5d1b]"
        >
          <AlarmClock className="size-3" />
          Log follow-up
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log follow-up</DialogTitle>
          <DialogDescription>
            {application.companyName} · {application.position}
            {application.nextFollowUpAt ? ` · ${getFollowUpLabel(application.nextFollowUpAt)}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`subject-${application.id}`}>Subject</Label>
            <Input
              id={`subject-${application.id}`}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`body-${application.id}`}>Message</Label>
            <Textarea
              id={`body-${application.id}`}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-[160px]"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-subtle/60 px-3 py-2 text-[11px] leading-relaxed text-ink-muted">
            <CalendarCheck className="size-3.5 shrink-0" />
            Saving records this exact email in the timeline and advances your next follow-up.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={pending}>
            {pending && <Loader2 className="size-3 animate-spin" />}
            {pending ? "Logging…" : "Log follow-up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
