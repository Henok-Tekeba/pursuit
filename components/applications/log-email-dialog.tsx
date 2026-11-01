"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  FileText,
  Loader2,
  Mail,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMAIL_KIND_LABELS, TEMPLATE_KIND_LABELS } from "@/lib/constants";
import type { EmailDirection, EmailKind, Template } from "@/lib/db/schema";
import { logEmailAction } from "@/app/actions/applications";
import { cn, resolveTemplate } from "@/lib/utils";

export type EmailDialogMode = "email" | "follow_up" | "reply";

const OUTBOUND_KINDS: EmailKind[] = ["initial", "follow_up", "other"];
const INBOUND_KINDS: EmailKind[] = ["reply", "interview", "assessment", "offer", "rejection", "other"];

export function LogEmailDialog({
  open,
  onOpenChange,
  mode,
  application,
  templates,
  myName,
  myEmail,
  hasEmails,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: EmailDialogMode;
  application: {
    id: string;
    companyName: string;
    position: string;
    contactName: string | null;
    contactEmail: string | null;
    appliedAt: string;
  };
  templates: Template[];
  myName: string;
  myEmail: string;
  hasEmails: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [direction, setDirection] = useState<EmailDirection>("outbound");
  const [kind, setKind] = useState<EmailKind>("follow_up");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [error, setError] = useState("");

  const defaultFollowUpBody = useMemo(() => {
    const firstName = application.contactName?.split(" ")[0] ?? "there";
    return `Hi ${firstName},\n\nI wanted to gently follow up on my application for the ${application.position} role at ${application.companyName}. I remain very interested and would be glad to share anything else that would be helpful.\n\nBest,\n${myName}`;
  }, [application.companyName, application.contactName, application.position, myName]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setOccurredAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    if (mode === "follow_up") {
      setDirection("outbound");
      setKind("follow_up");
      setSubject(`Re: ${application.position} at ${application.companyName}`);
      setBody(defaultFollowUpBody);
    } else if (mode === "reply") {
      setDirection("inbound");
      setKind("reply");
      setSubject(`Re: ${application.position} at ${application.companyName}`);
      setBody("");
    } else {
      setDirection("outbound");
      setKind(hasEmails ? "follow_up" : "initial");
      setSubject(
        hasEmails
          ? `Re: ${application.position} at ${application.companyName}`
          : `Quick question about the ${application.position} role`,
      );
      setBody(hasEmails ? defaultFollowUpBody : "");
    }
  }, [
    open,
    mode,
    hasEmails,
    application.position,
    application.companyName,
    defaultFollowUpBody,
  ]);

  const availableKinds = direction === "outbound" ? OUTBOUND_KINDS : INBOUND_KINDS;

  const changeDirection = (next: EmailDirection) => {
    setDirection(next);
    if (!(next === "outbound" ? OUTBOUND_KINDS : INBOUND_KINDS).includes(kind)) {
      setKind(next === "outbound" ? "follow_up" : "reply");
    }
  };

  const applyTemplate = (template: Template) => {
    const vars = {
      company: application.companyName,
      position: application.position,
      contactName: application.contactName,
      myName,
      email: myEmail,
    };
    setSubject(resolveTemplate(template.subject, vars));
    setBody(resolveTemplate(template.body, vars));
    setDirection("outbound");
    if (template.kind === "follow_up") setKind("follow_up");
    else if (template.kind === "cold_email") setKind("initial");
    else setKind("other");
  };

  const submit = () => {
    if (!subject.trim() || !body.trim()) {
      setError("Add both a subject and the exact email body.");
      return;
    }
    startTransition(async () => {
      const result = await logEmailAction({
        applicationId: application.id,
        direction,
        kind,
        subject,
        body,
        occurredAt: occurredAt ? occurredAt : undefined,
      });
      if (result.ok) {
        toast.success(direction === "inbound" ? "Reply recorded." : "Email logged.");
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "follow_up" ? "Log follow-up" : mode === "reply" ? "Record a reply" : "Log an email"}
          </DialogTitle>
          <DialogDescription>
            {application.companyName} · {application.position}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface-subtle/60 p-1">
            <button
              type="button"
              onClick={() => changeDirection("outbound")}
              className={cn(
                "flex h-7 items-center justify-center gap-1.5 rounded-md text-[12px] font-medium transition-colors",
                direction === "outbound"
                  ? "bg-surface-card text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              <ArrowUpRight className="size-3" />
              I sent this
            </button>
            <button
              type="button"
              onClick={() => changeDirection("inbound")}
              className={cn(
                "flex h-7 items-center justify-center gap-1.5 rounded-md text-[12px] font-medium transition-colors",
                direction === "inbound"
                  ? "bg-surface-card text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              <ArrowDownLeft className="size-3" />
              I received this
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email type</Label>
              <Select value={kind} onValueChange={(value) => setKind(value as EmailKind)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableKinds.map((value) => (
                    <SelectItem key={value} value={value}>
                      {EMAIL_KIND_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-occurred-at">Date & time</Label>
              <Input
                id="email-occurred-at"
                type="datetime-local"
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {direction === "outbound" && templates.length > 0 && (
            <div className="flex items-center justify-between rounded-md bg-surface-subtle px-2.5 py-1.5">
              <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                <Sparkles className="size-3" />
                Start from a saved template
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-ink underline underline-offset-2"
                  >
                    Templates
                    <ChevronDown className="size-2.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[260px]">
                  <DropdownMenuLabel>Email templates</DropdownMenuLabel>
                  {templates.map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      onSelect={() => applyTemplate(template)}
                      className="items-start"
                    >
                      <FileText className="mt-0.5" />
                      <span className="min-w-0">
                        <span className="block truncate">{template.name}</span>
                        <span className="mt-0.5 block text-[10.5px] text-ink-faint">
                          {TEMPLATE_KIND_LABELS[template.kind]}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-body">Exact email body</Label>
              <span className="text-[10px] text-ink-faint">{body.length} characters</span>
            </div>
            <Textarea
              id="email-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Paste or write the exact message here…"
              className="min-h-[180px]"
            />
          </div>

          <div className="flex items-start gap-2 rounded-md border border-line bg-surface-subtle/60 px-3 py-2 text-[10.5px] leading-relaxed text-ink-muted">
            <Mail className="mt-0.5 size-3 shrink-0" />
            {direction === "inbound"
              ? "Recording a received email updates the status automatically and becomes part of the immutable conversation history."
              : "This email is added as a new entry. Your previous emails are never overwritten."}
          </div>

          {error && (
            <p className="rounded-md border border-[#f4dfe3] bg-[#fff8f9] px-2.5 py-1.5 text-[11.5px] text-[#b64c5e]">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={pending}>
            {pending && <Loader2 className="size-3 animate-spin" />}
            {pending ? "Saving…" : direction === "inbound" ? "Record reply" : "Log email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
