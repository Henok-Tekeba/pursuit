"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDays, format, parseISO } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  FileText,
  Loader2,
  Mail,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  METHOD_LABELS,
  METHOD_ORDER,
  STATUS_LABELS,
  STATUS_ORDER,
  TEMPLATE_KIND_LABELS,
} from "@/lib/constants";
import type {
  ApplicationMethod,
  ApplicationStatus,
  Template,
  TemplateKind,
} from "@/lib/db/schema";
import {
  createApplicationAction,
  updateApplicationAction,
  type CreateApplicationInput,
} from "@/app/actions/applications";
import { autofillFromJobUrlAction } from "@/app/actions/job-import";
import { cn, getFirstFollowUpDate, resolveTemplate, todayDateOnly } from "@/lib/utils";

type FormMode = "create" | "edit";

type FormValues = {
  companyName: string;
  companyWebsite: string;
  position: string;
  location: string;
  jobUrl: string;
  contactName: string;
  contactEmail: string;
  method: ApplicationMethod;
  status: ApplicationStatus;
  appliedAt: string;
  nextFollowUpAt: string;
  notes: string;
  initialEmailSubject: string;
  initialEmailBody: string;
};

export type ApplicationFormInitialValues = {
  id?: string;
  companyName?: string;
  companyWebsite?: string | null;
  position?: string;
  location?: string | null;
  jobUrl?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  method?: ApplicationMethod;
  status?: ApplicationStatus;
  appliedAt?: string;
  nextFollowUpAt?: string | null;
  notes?: string | null;
};

const emailOrEmpty = z.string().trim().email("Enter a valid email address or leave it blank.").or(z.literal(""));
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.");

export function ApplicationForm({
  mode,
  initialValues,
  followUpIntervals,
  templates,
  defaultMethod,
  myName,
  myEmail,
}: {
  mode: FormMode;
  initialValues?: ApplicationFormInitialValues;
  followUpIntervals: number[];
  templates: Template[];
  defaultMethod: ApplicationMethod;
  myName: string;
  myEmail: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [manualFollowUp, setManualFollowUp] = useState(mode === "edit");
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [autofillPending, setAutofillPending] = useState(false);
  const [autofillNotice, setAutofillNotice] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const lastSuggested = useRef<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          companyName: z.string().trim().min(1, "Company name is required.").max(120),
          companyWebsite: z.string().trim().max(200),
          position: z.string().trim().min(1, "Position is required.").max(160),
          location: z.string().trim().max(120),
          jobUrl: z.string().trim().max(500),
          contactName: z.string().trim().max(120),
          contactEmail: emailOrEmpty,
          method: z.enum(["cold_email", "linkedin", "referral", "job_portal", "other"]),
          status: z.enum([
            "applied",
            "awaiting_response",
            "replied",
            "follow_up_due",
            "interview",
            "assessment",
            "offer",
            "rejected",
            "ghosted",
            "withdrawn",
          ]),
          appliedAt: dateString,
          nextFollowUpAt: dateString.or(z.literal("")),
          notes: z.string().max(10000),
          initialEmailSubject: z.string().max(300),
          initialEmailBody: z.string().max(60000),
        })
        .superRefine((values, context) => {
          if (mode !== "create") return;
          const hasSubject = values.initialEmailSubject.trim().length > 0;
          const hasBody = values.initialEmailBody.trim().length > 0;
          if (hasSubject && !hasBody) {
            context.addIssue({
              code: "custom",
              path: ["initialEmailBody"],
              message: "Add the exact email body, or clear the subject.",
            });
          }
          if (hasBody && !hasSubject) {
            context.addIssue({
              code: "custom",
              path: ["initialEmailSubject"],
              message: "Add a subject line for this email.",
            });
          }
        }),
    [mode],
  );

  const today = todayDateOnly();
  const initialAppliedAt = initialValues?.appliedAt ?? today;
  const initialNextFollowUp =
    initialValues?.nextFollowUpAt ?? getFirstFollowUpDate(initialAppliedAt, followUpIntervals) ?? "";

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: initialValues?.companyName ?? "",
      companyWebsite: initialValues?.companyWebsite ?? "",
      position: initialValues?.position ?? "",
      location: initialValues?.location ?? "",
      jobUrl: initialValues?.jobUrl ?? "",
      contactName: initialValues?.contactName ?? "",
      contactEmail: initialValues?.contactEmail ?? "",
      method: initialValues?.method ?? defaultMethod,
      status: initialValues?.status ?? "applied",
      appliedAt: initialAppliedAt,
      nextFollowUpAt: initialNextFollowUp,
      notes: initialValues?.notes ?? "",
      initialEmailSubject: "",
      initialEmailBody: "",
    },
  });

  const appliedAt = watch("appliedAt");
  const initialEmailSubject = watch("initialEmailSubject");
  const initialEmailBody = watch("initialEmailBody");

  useEffect(() => {
    if (mode !== "create" || manualFollowUp) return;
    const suggested = getFirstFollowUpDate(appliedAt, followUpIntervals) ?? "";
    if (suggested && suggested !== lastSuggested.current) {
      lastSuggested.current = suggested;
      setValue("nextFollowUpAt", suggested, { shouldValidate: true });
    }
  }, [appliedAt, followUpIntervals, manualFollowUp, mode, setValue]);

  const followUpPreview = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(appliedAt)) return [];
    try {
      const date = parseISO(appliedAt);
      return [...new Set(followUpIntervals)]
        .sort((a, b) => a - b)
        .map((days) => ({ days, date: format(addDays(date, days), "MMM d") }));
    } catch {
      return [];
    }
  }, [appliedAt, followUpIntervals]);

  const applyTemplate = (template: Template) => {
    const values = getValues();
    setLoadingTemplate(true);
    const vars = {
      company: values.companyName || "the company",
      position: values.position || "this role",
      contactName: values.contactName || "there",
      myName,
      email: myEmail,
    };
    setValue("initialEmailSubject", resolveTemplate(template.subject, vars), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("initialEmailBody", resolveTemplate(template.body, vars), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setLoadingTemplate(false);
    toast.success(`Loaded “${template.name}”`);
  };

  const autofill = async () => {
    const jobUrl = getValues("jobUrl").trim();
    if (!jobUrl) {
      setAutofillNotice({ type: "error", message: "Paste a job link first." });
      return;
    }

    setAutofillPending(true);
    setAutofillNotice(null);

    try {
      const response = await autofillFromJobUrlAction(jobUrl);
      if (!response.ok) {
        setAutofillNotice({ type: "error", message: response.error });
        return;
      }

      const { fields, source } = response.result;
      const entries: Array<[keyof FormValues, string | undefined]> = [
        ["companyName", fields.companyName],
        ["companyWebsite", fields.companyWebsite],
        ["position", fields.position],
        ["location", fields.location],
        ["jobUrl", fields.jobUrl],
      ];
      for (const [field, value] of entries) {
        if (value) {
          setValue(field, value, { shouldDirty: true, shouldValidate: true });
        }
      }

      setAutofillNotice({
        type: "success",
        message: `Filled from ${source}. Review the details before saving.`,
      });
      toast.success("Job details filled. Review before saving.");
    } catch {
      setAutofillNotice({
        type: "error",
        message: "We couldn't read that job page. Enter the details manually.",
      });
    } finally {
      setAutofillPending(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    const payload = {
      ...values,
      companyWebsite: values.companyWebsite || null,
      location: values.location || null,
      jobUrl: values.jobUrl || null,
      contactName: values.contactName || null,
      contactEmail: values.contactEmail || null,
      nextFollowUpAt: values.nextFollowUpAt || null,
      notes: values.notes || null,
      initialEmailSubject: values.initialEmailSubject || null,
      initialEmailBody: values.initialEmailBody || null,
    };

    const applicationId = initialValues?.id;
    if (mode === "edit" && !applicationId) {
      setServerError("This application could not be identified. Reload the page and try again.");
      return;
    }

    const result =
      mode === "create"
        ? await createApplicationAction(payload as CreateApplicationInput)
        : await updateApplicationAction({ ...payload, id: applicationId! });

    if (!result.ok) {
      setServerError(result.error);
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof FormValues, { type: "server", message: messages[0] });
          }
        }
      }
      toast.error(result.error);
      return;
    }

    toast.success(mode === "create" ? "Application created." : "Application updated.");
    const destination = mode === "create" ? `/applications/${result.id}` : `/applications/${initialValues?.id}`;
    router.push(destination);
    router.refresh();
  };

  return (
    <form id="application-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <PageHeader
        title={mode === "create" ? "New application" : "Edit application"}
        description={
          mode === "create"
            ? "Capture the role, the conversation, and the exact email you sent."
            : "Update the details without touching your saved email history."
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={mode === "create" ? "/applications" : `/applications/${initialValues?.id}`}>
                Cancel
              </Link>
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-3 animate-spin" />}
              {isSubmitting
                ? "Saving…"
                : mode === "create"
                  ? "Create application"
                  : "Save changes"}
            </Button>
          </>
        }
      />

      <div className="p-4">
        <div className="grid gap-4 min-[1150px]:grid-cols-[minmax(0,1fr)_310px]">
          <div className="space-y-4">
            {serverError && (
              <div className="flex items-start gap-2 rounded-lg border border-[#f4dfe3] bg-[#fff8f9] p-3 text-[12px] text-[#b64c5e] dark:border-[#4a2a30] dark:bg-[#2a1c1f]">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <div>
                  <p className="font-medium">We couldn&apos;t save this application.</p>
                  <p className="mt-0.5 opacity-85">{serverError}</p>
                </div>
              </div>
            )}

            <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
              <SectionHeader
                title="Role & company"
                description="The basics of the opportunity you're chasing."
              />
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <Field label="Company name" htmlFor="companyName" required error={errors.companyName?.message}>
                  <Input
                    id="companyName"
                    placeholder="e.g. Figma"
                    {...register("companyName")}
                  />
                </Field>
                <Field label="Company website" htmlFor="companyWebsite" error={errors.companyWebsite?.message}>
                  <Input
                    id="companyWebsite"
                    placeholder="figma.com"
                    inputMode="url"
                    {...register("companyWebsite")}
                  />
                </Field>
                <Field label="Position / title" htmlFor="position" required error={errors.position?.message}>
                  <Input
                    id="position"
                    placeholder="e.g. Product Design Intern"
                    {...register("position")}
                  />
                </Field>
                <Field label="Location" htmlFor="location" error={errors.location?.message}>
                  <Input
                    id="location"
                    placeholder="Remote, New York, NY…"
                    {...register("location")}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Job posting URL" htmlFor="jobUrl" error={errors.jobUrl?.message}>
                    <div className="flex items-center gap-2">
                      <Input
                        id="jobUrl"
                        placeholder="https://…"
                        inputMode="url"
                        className="min-w-0 flex-1"
                        {...register("jobUrl")}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 shrink-0"
                        onClick={autofill}
                        disabled={autofillPending}
                      >
                        {autofillPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="size-3.5" />
                        )}
                        {autofillPending ? "Reading…" : "Autofill"}
                      </Button>
                    </div>
                  </Field>
                  {autofillNotice && (
                    <p
                      role="status"
                      className={cn(
                        "mt-1.5 text-[10.5px] leading-relaxed",
                        autofillNotice.type === "error" ? "text-[#b64c5e]" : "text-[#2e8a61]",
                      )}
                    >
                      {autofillNotice.message}
                    </p>
                  )}
                  <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-faint">
                    Paste a company career page or ATS link. Pursuit fills only the fields it can
                    verify, then you review them before saving.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
              <SectionHeader
                title="Contact"
                description="The person on the other side of this conversation."
              />
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <Field label="Contact name" htmlFor="contactName" error={errors.contactName?.message}>
                  <Input
                    id="contactName"
                    placeholder="e.g. Maya Chen"
                    {...register("contactName")}
                  />
                </Field>
                <Field label="Contact email" htmlFor="contactEmail" error={errors.contactEmail?.message}>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="maya@example.com"
                    {...register("contactEmail")}
                  />
                </Field>
              </div>
            </section>

            {mode === "create" ? (
              <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3">
                  <div>
                    <h2 className="text-[13.5px] font-medium text-ink">The email you sent</h2>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      Optional, but saved exactly as written and never overwritten.
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="xs" disabled={loadingTemplate}>
                        <Sparkles className="size-3" />
                        {loadingTemplate ? "Loading…" : "Use a template"}
                        <ChevronDown className="size-2.5 text-ink-faint" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[260px]">
                      <DropdownMenuLabel>Email templates</DropdownMenuLabel>
                      {templates.length === 0 ? (
                        <DropdownMenuItem disabled>No templates yet</DropdownMenuItem>
                      ) : (
                        templates.map((template) => (
                          <DropdownMenuItem
                            key={template.id}
                            onSelect={() => applyTemplate(template)}
                            className="items-start"
                          >
                            <FileText className="mt-0.5" />
                            <span className="min-w-0">
                              <span className="block truncate">{template.name}</span>
                              <span className="mt-0.5 block text-[10.5px] text-ink-faint">
                                {TEMPLATE_KIND_LABELS[template.kind as TemplateKind]}
                              </span>
                            </span>
                          </DropdownMenuItem>
                        ))
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/templates">
                          <Sparkles />
                          Manage templates
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-3 p-4">
                  <Field
                    label="Email subject"
                    htmlFor="initialEmailSubject"
                    error={errors.initialEmailSubject?.message}
                  >
                    <Input
                      id="initialEmailSubject"
                      placeholder="Quick question about the Product Design Intern role"
                      {...register("initialEmailSubject")}
                    />
                  </Field>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <Label htmlFor="initialEmailBody">Exact email body</Label>
                      <span className="text-[10.5px] text-ink-faint">
                        {initialEmailBody.length > 0 ? `${initialEmailBody.length} characters` : "Plain text"}
                      </span>
                    </div>
                    <Textarea
                      id="initialEmailBody"
                      placeholder={"Hi Maya,\n\nI'm reaching out about…"}
                      className="min-h-[168px]"
                      {...register("initialEmailBody")}
                    />
                    {errors.initialEmailBody?.message && (
                      <p className="mt-1 text-[11px] text-[#b64c5e]">{errors.initialEmailBody.message}</p>
                    )}
                  </div>
                  {(initialEmailSubject || initialEmailBody) && (
                    <div className="flex items-start gap-2 rounded-md border border-line bg-surface-subtle/60 px-2.5 py-2 text-[10.5px] leading-relaxed text-ink-muted">
                      <Mail className="mt-0.5 size-3 shrink-0" />
                      This will become the first entry in the email history. Later follow-ups and replies
                      are added as new entries.
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <div className="flex items-center gap-2 rounded-[10px] border border-line bg-surface-card px-4 py-3 text-[11.5px] text-ink-muted shadow-card">
                <Mail className="size-3.5 shrink-0 text-ink-faint" />
                Email history is preserved on the timeline and cannot be edited here.
                <Link
                  href={`/applications/${initialValues?.id}`}
                  className="ml-auto shrink-0 font-medium text-ink underline underline-offset-2"
                >
                  View emails
                </Link>
              </div>
            )}

            <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
              <SectionHeader title="Notes" description="Anything you want to remember next time." />
              <div className="p-4">
                <Textarea
                  id="notes"
                  placeholder="Prep notes, referral context, salary details, gut feel…"
                  className="min-h-[100px]"
                  {...register("notes")}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
              <SectionHeader title="Pipeline details" description="Where this application sits today." />
              <div className="space-y-3 p-4">
                <div className="space-y-1.5">
                  <Label>Application method</Label>
                  <Controller
                    control={control}
                    name="method"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {METHOD_ORDER.map((method) => (
                            <SelectItem key={method} value={method}>
                              {METHOD_LABELS[method]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Current status</Label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {STATUS_ORDER.map((status) => (
                            <SelectItem key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {watch("status") === "ghosted" && (
                    <p className="text-[10.5px] leading-relaxed text-[#b47b2c]">
                      Ghosted should be a deliberate choice after your follow-ups go unanswered.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="appliedAt">Date applied</Label>
                  <Input
                    id="appliedAt"
                    type="date"
                    max={today}
                    {...register("appliedAt")}
                  />
                  {errors.appliedAt?.message && (
                    <p className="text-[11px] text-[#b64c5e]">{errors.appliedAt.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="nextFollowUpAt">Next follow-up</Label>
                    {mode === "create" && (
                      <button
                        type="button"
                        onClick={() => {
                          setManualFollowUp(false);
                          const suggested =
                            getFirstFollowUpDate(appliedAt, followUpIntervals) ?? "";
                          setValue("nextFollowUpAt", suggested, { shouldValidate: true });
                        }}
                        className="inline-flex items-center gap-1 text-[10px] text-ink-faint transition-colors hover:text-ink"
                      >
                        <RotateCcw className="size-2.5" />
                        Suggest
                      </button>
                    )}
                  </div>
                  <Input
                    id="nextFollowUpAt"
                    type="date"
                    {...register("nextFollowUpAt", {
                      onChange: () => setManualFollowUp(true),
                    })}
                  />
                  {errors.nextFollowUpAt?.message && (
                    <p className="text-[11px] text-[#b64c5e]">{errors.nextFollowUpAt.message}</p>
                  )}
                  <p className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-ink-faint">
                    <CalendarDays className="mt-0.5 size-3 shrink-0" />
                    Calculated automatically from your cadence. You can override it.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[10px] border border-line bg-surface-card p-4 shadow-card">
              <h3 className="text-[12.5px] font-medium text-ink">Follow-up cadence</h3>
              <p className="mt-0.5 text-[10.5px] text-ink-muted">Suggested from your date applied</p>
              <div className="mt-3 space-y-2">
                {followUpPreview.length === 0 ? (
                  <p className="text-[11px] text-ink-faint">Choose a valid applied date.</p>
                ) : (
                  followUpPreview.map((entry) => (
                    <div key={entry.days} className="flex items-center gap-2.5">
                      <span className="grid size-6 place-items-center rounded-full border border-line bg-surface-subtle text-[10px] font-medium text-ink-secondary">
                        {entry.days}d
                      </span>
                      <div className="flex-1 border-b border-dashed border-line pb-1">
                        <p className="text-[11px] text-ink-muted">Day {entry.days}</p>
                      </div>
                      <span className="text-[11px] font-medium text-ink-secondary">{entry.date}</span>
                    </div>
                  ))
                )}
              </div>
              <Link
                href="/settings"
                className="mt-3 inline-flex text-[10.5px] text-ink-muted underline underline-offset-2 hover:text-ink"
              >
                Adjust follow-up intervals
              </Link>
            </section>

            <div className="rounded-[10px] border border-line bg-surface-card px-4 py-3 text-[10.5px] leading-relaxed text-ink-muted shadow-card">
              <p className="flex items-center gap-1.5 font-medium text-ink-secondary">
                <Sparkles className="size-3 text-[#b47b2c]" />
                A note on privacy
              </p>
              <p className="mt-1.5">
                Only you can see this application. Emails and notes are stored against your account and
                never shared.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </form>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-line px-4 py-3">
      <h2 className="text-[13.5px] font-medium text-ink">{title}</h2>
      <p className="mt-0.5 text-[11px] text-ink-muted">{description}</p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className={cn(error && "text-[#b64c5e]")}>
          {label}
          {required && <span className="ml-0.5 text-[#d95b6e]">*</span>}
        </Label>
      </div>
      {children}
      {error && <p className="text-[10.5px] leading-tight text-[#b64c5e]">{error}</p>}
    </div>
  );
}
