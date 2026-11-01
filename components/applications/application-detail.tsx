"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CircleAlert,
  Clock3,
  Copy,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserRound,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { ActivityType, ApplicationMethod, ApplicationStatus, Template } from "@/lib/db/schema";
import { METHOD_LABELS } from "@/lib/constants";
import {
  calendarDaysBetween,
  cn,
  daysSince,
  formatDate,
  getFollowUpLabel,
  isOverdue,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusChanger } from "./status-changer";
import { LogEmailDialog, type EmailDialogMode } from "./log-email-dialog";
import { ScheduleFollowUpDialog } from "./schedule-follow-up-dialog";
import { ActivityTimeline } from "./activity-timeline";
import { EmailHistory, type EmailRecord } from "./email-history";
import { NotesPanel, type NoteRecord } from "./notes-panel";
import { PersonAvatar } from "@/components/company-avatar";
import { EmptyState } from "@/components/empty-state";
import { deleteApplicationAction } from "@/app/actions/applications";

type ApplicationDetailData = {
  id: string;
  reference: string;
  companyName: string;
  companyWebsite: string | null;
  position: string;
  location: string | null;
  jobUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactAvatarUrl: string | null;
  method: ApplicationMethod;
  status: ApplicationStatus;
  appliedAt: string;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  firstResponseAt: string | null;
  notes: string | null;
  companyNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export function ApplicationDetail({
  application,
  emails,
  timeline,
  templates,
  user,
  followUpIntervals,
  initialAction,
}: {
  application: ApplicationDetailData;
  emails: EmailRecord[];
  timeline: Array<{
    id: string;
    type: ActivityType;
    title: string;
    description: string | null;
    occurredAt: string;
  }>;
  templates: Template[];
  user: { name: string; email: string };
  followUpIntervals: number[];
  initialAction?: string;
}) {
  const router = useRouter();
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailMode, setEmailMode] = useState<EmailDialogMode>("email");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [defaultTab, setDefaultTab] = useState(
    initialAction === "email" || initialAction === "follow-up" ? "emails" : "activity",
  );

  useEffect(() => {
    if (initialAction === "email") {
      setEmailMode("email");
      setEmailOpen(true);
    }
    if (initialAction === "follow-up") {
      setEmailMode("follow_up");
      setEmailOpen(true);
    }
  }, [initialAction]);

  const notes = timeline
    .filter((entry) => entry.type === "note_added")
    .map<NoteRecord>((entry) => ({
      id: entry.id,
      description: entry.description,
      occurredAt: entry.occurredAt,
    }));

  const openEmail = (mode: EmailDialogMode) => {
    setEmailMode(mode);
    setDefaultTab("emails");
    setEmailOpen(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Application link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  const responseDays = application.firstResponseAt
    ? Math.max(0, calendarDaysBetween(application.appliedAt, application.firstResponseAt) ?? 0)
    : null;

  const followUpOverdue = isOverdue(application.nextFollowUpAt);
  const followUpNone = !application.nextFollowUpAt;

  return (
    <div className="min-h-full pb-6">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3" />
          All applications
        </Link>
        <span className="text-[10.5px] text-ink-faint">/</span>
        <span className="truncate text-[11.5px] text-ink-secondary">{application.reference}</span>
        <span className="ml-auto text-[10.5px] text-ink-faint">
          Updated {formatDate(application.updatedAt, "MMM d 'at' h:mm a")}
        </span>
      </div>

      <div className="border-b border-line bg-surface-main px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface-card text-[15.5px] font-semibold text-ink-secondary shadow-sm">
              {application.companyName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[23px] font-medium leading-tight tracking-[-0.035em] text-ink">
                  {application.companyName}
                </h1>
                {application.companyWebsite && (
                  <a
                    href={application.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10.5px] text-ink-muted underline-offset-2 hover:text-ink hover:underline"
                  >
                    <Globe className="size-2.5" />
                    Website
                  </a>
                )}
              </div>
              <p className="mt-1 text-[13.5px] text-ink-secondary">{application.position}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusChanger applicationId={application.id} status={application.status} />
                <span className="inline-flex items-center gap-1 rounded-[4px] border border-line bg-surface-card px-1.5 py-[3px] text-[10.5px] text-ink-muted">
                  {METHOD_LABELS[application.method]}
                </span>
                <span className="text-[10.5px] text-ink-faint">{application.reference}</span>
                {application.location && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-ink-faint">
                    <MapPin className="size-2.5" />
                    {application.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" onClick={() => openEmail("email")}>
              <Mail className="size-3.5" strokeWidth={1.8} />
              Log email
            </Button>
            <Button size="sm" variant="outline" onClick={() => openEmail("follow_up")}>
              <ArrowUpRight className="size-3.5" strokeWidth={1.8} />
              Follow up
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/applications/${application.id}/edit`}>
                <Pencil className="size-3.5" strokeWidth={1.8} />
                Edit
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-lg border border-line bg-surface-card text-ink-secondary transition-colors hover:border-line-strong hover:text-ink"
                  aria-label="More application actions"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[190px]">
                <DropdownMenuItem onSelect={copyLink}>
                  <Copy />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/applications/${application.id}/edit`}>
                    <Pencil />
                    Edit application
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-[#c24e63] focus:text-[#c24e63]"
                  onSelect={() => setDeleteOpen(true)}
                >
                  <Trash2 className="!text-[#c24e63]" />
                  Delete application
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 divide-line overflow-hidden rounded-lg border border-line bg-surface-card sm:grid-cols-4 sm:divide-x">
          <MetaCell
            icon={CalendarDays}
            label="Applied"
            value={formatDate(application.appliedAt)}
            hint={`${daysSince(application.appliedAt)} day${daysSince(application.appliedAt) === 1 ? "" : "s"} ago`}
          />
          <MetaCell
            icon={Clock3}
            label="Last contact"
            value={application.lastContactAt ? formatDate(application.lastContactAt) : "No contact"}
            hint={
              application.lastContactAt
                ? `${daysSince(application.lastContactAt)} day${daysSince(application.lastContactAt) === 1 ? "" : "s"} ago`
                : "No emails logged yet"
            }
          />
          <MetaCell
            icon={CalendarDays}
            label="Next follow-up"
            value={application.nextFollowUpAt ? formatDate(application.nextFollowUpAt) : "Not scheduled"}
            hint={getFollowUpLabel(application.nextFollowUpAt)}
            tone={followUpOverdue ? "warn" : followUpNone ? "muted" : "normal"}
          />
          <MetaCell
            icon={Mail}
            label="First response"
            value={application.firstResponseAt ? formatDate(application.firstResponseAt) : "Awaiting reply"}
            hint={responseDays !== null ? `${responseDays} day${responseDays === 1 ? "" : "s"} after applying` : "No response yet"}
          />
        </div>
      </div>

      {followUpOverdue && (
        <div className="border-b border-[#f3e2c7] bg-[#fffaf2] px-4 py-2.5 dark:border-[#3d3122] dark:bg-[#241f17]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-[11.5px] text-[#a36c1f]">
              <CircleAlert className="size-3.5 shrink-0" />
              <span>
                Follow-up is {getFollowUpLabel(application.nextFollowUpAt).toLowerCase()}. Keep the conversation
                warm with a short check-in.
              </span>
            </p>
            <div className="flex items-center gap-2">
              <Button size="xs" variant="outline" onClick={() => openEmail("follow_up")}>
                Log follow-up
              </Button>
              <ScheduleFollowUpDialog
                applicationId={application.id}
                currentDate={application.nextFollowUpAt}
                triggerLabel="Reschedule"
                triggerVariant="ghost"
                triggerSize="xs"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid items-start gap-4 p-4 min-[1150px]:grid-cols-[minmax(0,1fr)_300px] min-[1300px]:grid-cols-[minmax(0,1fr)_316px]">
        <div className="min-w-0 rounded-[10px] border border-line bg-surface-card shadow-card">
          <Tabs value={defaultTab} onValueChange={setDefaultTab}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
              <TabsList>
                <TabsTrigger value="activity">
                  Activity
                  <span className="ml-1.5 rounded-[3px] bg-surface-subtle px-1 text-[9.5px] text-ink-muted data-[state=active]:bg-surface-subtle">
                    {timeline.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="emails">
                  Emails
                  <span className="ml-1.5 rounded-[3px] bg-surface-subtle px-1 text-[9.5px] text-ink-muted">
                    {emails.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="notes">
                  Notes
                  <span className="ml-1.5 rounded-[3px] bg-surface-subtle px-1 text-[9.5px] text-ink-muted">
                    {notes.length}
                  </span>
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="xs" onClick={() => openEmail("reply")}>
                  <ArrowDownLeft className="size-3" />
                  Record reply
                </Button>
                <Button variant="outline" size="xs" onClick={() => openEmail("email")}>
                  <Mail className="size-3" />
                  Log email
                </Button>
              </div>
            </div>
            <TabsContent value="activity" className="mx-4 mb-4 mt-4">
              <ActivityTimeline activities={timeline} />
            </TabsContent>
            <TabsContent value="emails" className="mx-4 mb-4 mt-4">
              <EmailHistory
                emails={emails}
                onCompose={() => openEmail("email")}
                onReply={() => openEmail("reply")}
              />
            </TabsContent>
            <TabsContent value="notes" className="mx-4 mb-4 mt-4">
              <NotesPanel
                applicationId={application.id}
                applicationNotes={application.notes}
                notes={notes}
              />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-3">
          <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
            <div className="border-b border-line px-3.5 py-2.5">
              <h2 className="text-[13px] font-medium text-ink">Contact</h2>
            </div>
            <div className="p-3.5">
              {application.contactName || application.contactEmail ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <PersonAvatar
                      name={application.contactName || application.companyName}
                      src={application.contactAvatarUrl}
                      className="size-9"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {application.contactName || "Unnamed contact"}
                      </p>
                      <p className="truncate text-[10.5px] text-ink-muted">
                        {application.contactEmail || "No email on file"}
                      </p>
                    </div>
                  </div>
                  {application.contactEmail ? (
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      <Button asChild variant="outline" size="xs" className="w-full">
                        <a href={`mailto:${application.contactEmail}`}>
                          <Mail className="size-3" />
                          Email
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        className="w-full"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(application.contactEmail!);
                            toast.success("Email address copied.");
                          } catch {
                            toast.error("Couldn't copy the address.");
                          }
                        }}
                      >
                        <Copy className="size-3" />
                        Copy
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-3 rounded-md bg-surface-subtle px-2.5 py-2 text-[10.5px] text-ink-muted">
                      Add a contact email in Edit to reach them faster.
                    </p>
                  )}
                </>
              ) : (
                <EmptyState
                  icon={UserRound}
                  title="No contact yet"
                  description="Add the person you're speaking with in the application details."
                  compact
                />
              )}
            </div>
          </section>

          <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
            <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
              <h2 className="text-[13px] font-medium text-ink">Follow-up tracking</h2>
              <ScheduleFollowUpDialog
                applicationId={application.id}
                currentDate={application.nextFollowUpAt}
                triggerLabel="Set date"
                triggerVariant="ghost"
                triggerSize="xs"
                triggerClassName="px-1.5"
              />
            </div>
            <div className="space-y-2.5 p-3.5">
              <TrackerRow label="Days since application" value={`${daysSince(application.appliedAt)} days`} />
              <TrackerRow
                label="Days since last contact"
                value={
                  application.lastContactAt
                    ? `${daysSince(application.lastContactAt)} days`
                    : "No contact yet"
                }
              />
              <TrackerRow
                label="Next follow-up"
                value={application.nextFollowUpAt ? getFollowUpLabel(application.nextFollowUpAt) : "Not scheduled"}
                tone={followUpOverdue ? "warn" : "normal"}
                hint={application.nextFollowUpAt ? formatDate(application.nextFollowUpAt) : undefined}
              />
              <div className="rounded-md border border-line bg-surface-subtle/50 p-2.5">
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint">
                  Cadence
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {followUpIntervals.map((interval) => (
                    <span
                      key={interval}
                      className="rounded-[4px] border border-line bg-surface-card px-1.5 py-0.5 text-[10px] text-ink-muted"
                    >
                      Day {interval}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <Button variant="outline" size="xs" className="w-full" onClick={() => openEmail("follow_up")}>
                  <ArrowUpRight className="size-3" />
                  Follow up
                </Button>
                <ScheduleFollowUpDialog
                  applicationId={application.id}
                  currentDate={application.nextFollowUpAt}
                  triggerLabel="Schedule"
                  triggerVariant="outline"
                  triggerSize="xs"
                  triggerClassName="w-full"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
            <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
              <h2 className="text-[13px] font-medium text-ink">Details</h2>
              <Link
                href={`/applications/${application.id}/edit`}
                className="text-[10.5px] text-ink-muted hover:text-ink"
              >
                Edit
              </Link>
            </div>
            <div className="divide-y divide-line text-[11px]">
              <DetailRow label="Method" value={METHOD_LABELS[application.method]} />
              <DetailRow label="Reference" value={application.reference} />
              <DetailRow label="Created" value={formatDate(application.createdAt)} />
              <DetailRow
                label="Response time"
                value={responseDays !== null ? `${responseDays} days` : "Awaiting"}
              />
              {application.jobUrl && (
                <div className="flex items-center justify-between gap-2 px-3.5 py-2">
                  <span className="text-ink-muted">Job posting</span>
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-ink underline underline-offset-2"
                  >
                    Open
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
              )}
              {application.companyWebsite && (
                <div className="flex items-center justify-between gap-2 px-3.5 py-2">
                  <span className="text-ink-muted">Website</span>
                  <a
                    href={application.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 text-[11px] font-medium text-ink underline underline-offset-2"
                  >
                    <span className="max-w-[150px] truncate">{application.companyWebsite.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="size-2.5 shrink-0" />
                  </a>
                </div>
              )}
              {application.companyNotes && (
                <div className="px-3.5 py-2.5">
                  <p className="text-ink-muted">Company note</p>
                  <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-ink-secondary">
                    {application.companyNotes}
                  </p>
                </div>
              )}
            </div>
          </section>

          {application.notes && (
            <section className="rounded-[10px] border border-line bg-surface-card p-3.5 shadow-card">
              <h2 className="text-[13px] font-medium text-ink">Latest notes</h2>
              <p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-ink-muted">
                {application.notes}
              </p>
            </section>
          )}
        </aside>
      </div>

      <LogEmailDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        mode={emailMode}
        application={{
          id: application.id,
          companyName: application.companyName,
          position: application.position,
          contactName: application.contactName,
          contactEmail: application.contactEmail,
          appliedAt: application.appliedAt,
        }}
        templates={templates}
        myName={user.name}
        myEmail={user.email}
        hasEmails={emails.length > 0}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete this application?</DialogTitle>
            <DialogDescription>
              This removes {application.companyName} ({application.position}), including all emails,
              notes, and history. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteApplicationAction(application.id);
                  if (result.ok) {
                    toast.success("Application deleted.");
                    router.push("/applications");
                    router.refresh();
                  } else {
                    toast.error(result.error);
                  }
                })
              }
            >
              {pending && <Loader2 className="size-3 animate-spin" />}
              {pending ? "Deleting…" : "Delete application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetaCell({
  icon: Icon,
  label,
  value,
  hint,
  tone = "normal",
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  hint: string;
  tone?: "normal" | "warn" | "muted";
}) {
  return (
    <div className="flex items-start gap-2.5 p-3">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-surface-subtle text-ink-muted">
        <Icon className="size-3" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-ink-faint">{label}</p>
        <p className="mt-1 truncate text-[12px] font-medium text-ink">{value}</p>
        <p
          className={cn(
            "mt-0.5 truncate text-[10px]",
            tone === "warn" ? "text-[#c1842c]" : "text-ink-faint",
          )}
        >
          {hint}
        </p>
      </div>
    </div>
  );
}

function TrackerRow({
  label,
  value,
  hint,
  tone = "normal",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "normal" | "warn";
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11px] text-ink-muted">{label}</span>
      <span className="text-right">
        <span
          className={cn(
            "block text-[11.5px] font-medium",
            tone === "warn" ? "text-[#c1842c]" : "text-ink",
          )}
        >
          {value}
        </span>
        {hint && <span className="mt-0.5 block text-[9.5px] text-ink-faint">{hint}</span>}
      </span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3.5 py-2">
      <span className="text-ink-muted">{label}</span>
      <span className="max-w-[170px] truncate text-right font-medium text-ink-secondary">{value}</span>
    </div>
  );
}
