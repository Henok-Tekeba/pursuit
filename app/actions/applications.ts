"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import {
  activities,
  applications,
  companies,
  emailInteractions,
  settings,
  templates,
  type ActivityType,
  type ApplicationMethod,
  type ApplicationStatus,
  type EmailDirection,
  type EmailKind,
  type TemplateKind,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/session";
import {
  ACTIVE_STATUSES,
  STATUS_LABELS,
  TEMPLATE_KIND_LABELS,
} from "@/lib/constants";
import {
  formatDate,
  getFirstFollowUpDate,
  getNextFollowUpDate,
  toDateOnly,
} from "@/lib/utils";

export type ActionResponse<T = void> =
  | { ok: true; message?: string; id?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.");

const optionalEmail = z
  .union([z.string().trim().email("Enter a valid email."), z.literal("")])
  .nullable()
  .optional();

const methodSchema = z.enum([
  "cold_email",
  "linkedin",
  "referral",
  "job_portal",
  "other",
]);

const statusSchema = z.enum([
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
]);

const emailDirectionSchema = z.enum(["outbound", "inbound"]);
const emailKindSchema = z.enum([
  "initial",
  "follow_up",
  "reply",
  "interview",
  "assessment",
  "offer",
  "rejection",
  "other",
]);
const templateKindSchema = z.enum(["cold_email", "follow_up", "reply", "other"]);

const createApplicationSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required.").max(120),
  companyWebsite: z.string().trim().max(200).optional().nullable(),
  position: z.string().trim().min(1, "Position is required.").max(160),
  location: z.string().trim().max(120).optional().nullable(),
  jobUrl: z.string().trim().max(500).optional().nullable(),
  contactName: z.string().trim().max(120).optional().nullable(),
  contactEmail: optionalEmail,
  contactAvatarUrl: z.string().trim().max(500).optional().nullable(),
  method: methodSchema.default("cold_email"),
  status: statusSchema.default("applied"),
  appliedAt: dateString,
  nextFollowUpAt: z.union([dateString, z.literal("")]).optional().nullable(),
  notes: z.string().trim().max(10000).optional().nullable(),
  initialEmailSubject: z.string().trim().max(300).optional().nullable(),
  initialEmailBody: z.string().trim().max(30000).optional().nullable(),
});

export type CreateApplicationInput = z.input<typeof createApplicationSchema>;

const updateApplicationSchema = createApplicationSchema.partial().extend({
  id: z.string().uuid(),
});

function normalizeWebsite(value: string | null | undefined) {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    if (!url.hostname.includes(".")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function domainFromWebsite(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function asNullable(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseDateTimeLocal(value: string | undefined) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function statusAfterInbound(
  kind: EmailKind,
  current: ApplicationStatus,
): ApplicationStatus {
  const advanced = ["interview", "assessment", "offer", "rejected", "withdrawn", "ghosted"];
  if (kind === "interview") {
    return advanced.includes(current) && current !== "interview" ? current : "interview";
  }
  if (kind === "assessment") {
    return ["offer", "rejected", "withdrawn"].includes(current) ? current : "assessment";
  }
  if (kind === "offer") return "offer";
  if (kind === "rejection") return "rejected";
  if (kind === "reply") {
    if (["interview", "assessment", "offer", "rejected", "withdrawn"].includes(current)) {
      return current;
    }
    return "replied";
  }
  return current;
}

function emailActivityType(direction: EmailDirection, kind: EmailKind): ActivityType {
  if (direction === "outbound") {
    return kind === "follow_up" ? "follow_up_sent" : "email_sent";
  }
  if (kind === "interview") return "interview_scheduled";
  if (kind === "assessment") return "assessment_received";
  if (kind === "offer") return "offer_received";
  if (kind === "rejection") return "rejection_received";
  return "reply_received";
}

function emailActivityTitle(direction: EmailDirection, kind: EmailKind) {
  if (direction === "outbound") {
    if (kind === "initial") return "Initial email sent";
    if (kind === "follow_up") return "Follow-up sent";
    return "Email sent";
  }
  if (kind === "reply") return "Reply received";
  if (kind === "interview") return "Interview invitation";
  if (kind === "assessment") return "Assessment received";
  if (kind === "offer") return "Offer received";
  if (kind === "rejection") return "Rejection received";
  return "Email received";
}

function revalidateApplication(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/applications");
  revalidatePath("/follow-ups");
  revalidatePath("/emails");
  revalidatePath("/companies");
  revalidatePath("/analytics");
  revalidatePath("/notifications");
  if (id) revalidatePath(`/applications/${id}`);
}

export async function createApplicationAction(
  input: CreateApplicationInput,
): Promise<ActionResponse<{ id: string }>> {
  const user = await requireUser();
  const parsed = createApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;
  const db = await getDb();
  const userSettings = await db.query.settings.findFirst({
    where: eq(settings.userId, user.id),
  });
  const intervals = userSettings?.followUpIntervals ?? [5, 10, 17];
  const website = normalizeWebsite(data.companyWebsite);
  const appliedAt = data.appliedAt;

  try {
    const companyName = data.companyName.trim();
    let company = await db.query.companies.findFirst({
      where: and(
        eq(companies.userId, user.id),
        sql`lower(${companies.name}) = ${companyName.toLowerCase()}`,
      ),
    });
    if (!company) {
      const inserted = await db
        .insert(companies)
        .values({
          userId: user.id,
          name: companyName,
          website,
          domain: domainFromWebsite(website),
        })
        .returning();
      company = inserted[0];
    } else if (website && !company.website) {
      await db
        .update(companies)
        .set({ website, domain: domainFromWebsite(website), updatedAt: new Date() })
        .where(eq(companies.id, company.id));
    }

    const initialSubject = asNullable(data.initialEmailSubject);
    const initialBody = asNullable(data.initialEmailBody);
    const hasInitialEmail = Boolean(initialSubject || initialBody);
    const initialOccurredAt = new Date(`${appliedAt}T09:00:00`);
    const nextFollowUpAt =
      data.nextFollowUpAt && data.nextFollowUpAt !== ""
        ? data.nextFollowUpAt
        : getFirstFollowUpDate(appliedAt, intervals);

    const insertedApps = await db
      .insert(applications)
      .values({
        userId: user.id,
        companyId: company.id,
        position: data.position.trim(),
        location: asNullable(data.location),
        jobUrl: normalizeWebsite(data.jobUrl),
        contactName: asNullable(data.contactName),
        contactEmail: asNullable(data.contactEmail),
        contactAvatarUrl: asNullable(data.contactAvatarUrl),
        method: data.method,
        status: data.status,
        appliedAt,
        nextFollowUpAt,
        lastContactAt: hasInitialEmail ? initialOccurredAt : null,
        notes: asNullable(data.notes),
        updatedAt: new Date(),
      })
      .returning();
    const application = insertedApps[0];

    await db.insert(activities).values({
      userId: user.id,
      applicationId: application.id,
      type: "application_created",
      title: "Application created",
      description: `Applied for ${data.position} at ${companyName} via ${data.method.replaceAll("_", " ")}.`,
      occurredAt: initialOccurredAt,
    });

    if (hasInitialEmail) {
      const [email] = await db
        .insert(emailInteractions)
        .values({
          userId: user.id,
          applicationId: application.id,
          direction: "outbound",
          kind: "initial",
          subject: initialSubject ?? `Application: ${data.position}`,
          body: initialBody ?? "",
          fromEmail: user.email,
          toEmail: data.contactEmail || null,
          occurredAt: initialOccurredAt,
        })
        .returning();
      await db.insert(activities).values({
        userId: user.id,
        applicationId: application.id,
        emailId: email.id,
        type: "email_sent",
        title: "Initial email sent",
        description: email.subject,
        occurredAt: new Date(initialOccurredAt.getTime() + 60_000),
      });
    }

    if (nextFollowUpAt) {
      await db.insert(activities).values({
        userId: user.id,
        applicationId: application.id,
        type: "follow_up_scheduled",
        title: "Follow-up scheduled",
        description: `Next follow-up planned for ${formatDate(nextFollowUpAt)}.`,
        occurredAt: new Date(initialOccurredAt.getTime() + 2 * 60_000),
      });
    }

    revalidateApplication(application.id);
    return { ok: true, message: "Application created.", id: application.id };
  } catch (error) {
    console.error("createApplicationAction", error);
    return { ok: false, error: "We couldn't create that application. Please try again." };
  }
}

export async function updateApplicationAction(
  input: z.input<typeof updateApplicationSchema>,
): Promise<ActionResponse<{ id: string }>> {
  const user = await requireUser();
  const parsed = updateApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;
  const db = await getDb();
  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.id, data.id), eq(applications.userId, user.id)),
  });
  if (!existing) return { ok: false, error: "Application not found." };

  try {
    const website = normalizeWebsite(data.companyWebsite);
    if (data.companyName) {
      await db
        .update(companies)
        .set({
          name: data.companyName.trim(),
          ...(data.companyWebsite !== undefined
            ? { website, domain: domainFromWebsite(website) }
            : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(companies.id, existing.companyId), eq(companies.userId, user.id)));
    }

    const statusChanged = data.status && data.status !== existing.status;
    const appliedAt = data.appliedAt ?? existing.appliedAt;
    const nextFollowUpAt =
      data.nextFollowUpAt !== undefined
        ? data.nextFollowUpAt || null
        : existing.nextFollowUpAt;

    await db
      .update(applications)
      .set({
        ...(data.position ? { position: data.position.trim() } : {}),
        ...(data.location !== undefined ? { location: asNullable(data.location) } : {}),
        ...(data.jobUrl !== undefined ? { jobUrl: normalizeWebsite(data.jobUrl) } : {}),
        ...(data.contactName !== undefined ? { contactName: asNullable(data.contactName) } : {}),
        ...(data.contactEmail !== undefined ? { contactEmail: asNullable(data.contactEmail) } : {}),
        ...(data.contactAvatarUrl !== undefined
          ? { contactAvatarUrl: asNullable(data.contactAvatarUrl) }
          : {}),
        ...(data.method ? { method: data.method } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.appliedAt ? { appliedAt } : {}),
        ...(nextFollowUpAt !== undefined ? { nextFollowUpAt } : {}),
        ...(data.notes !== undefined ? { notes: asNullable(data.notes) } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(applications.id, data.id), eq(applications.userId, user.id)));

    if (statusChanged && data.status) {
      await db.insert(activities).values({
        userId: user.id,
        applicationId: data.id,
        type: data.status === "withdrawn" ? "withdrawn" : "status_changed",
        title:
          data.status === "withdrawn"
            ? "Application withdrawn"
            : `Status updated to ${STATUS_LABELS[data.status]}`,
        description: `Changed from ${STATUS_LABELS[existing.status]} to ${STATUS_LABELS[data.status]}.`,
        metadata: { from: existing.status, to: data.status },
        occurredAt: new Date(),
      });
    }

    if (data.notes !== undefined && (data.notes || "") !== (existing.notes || "")) {
      await db.insert(activities).values({
        userId: user.id,
        applicationId: data.id,
        type: "note_added",
        title: "Notes updated",
        description: asNullable(data.notes),
        occurredAt: new Date(),
      });
    }

    revalidateApplication(data.id);
    return { ok: true, message: "Application updated.", id: data.id };
  } catch (error) {
    console.error("updateApplicationAction", error);
    return { ok: false, error: "We couldn't update that application. Please try again." };
  }
}

export async function deleteApplicationAction(id: string): Promise<ActionResponse> {
  const user = await requireUser();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid application." };
  const db = await getDb();
  const deleted = await db
    .delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)))
    .returning({ id: applications.id });
  if (!deleted.length) return { ok: false, error: "Application not found." };
  revalidateApplication(id);
  return { ok: true, message: "Application deleted." };
}

export async function updateApplicationStatusAction(
  id: string,
  status: ApplicationStatus,
): Promise<ActionResponse> {
  const user = await requireUser();
  if (!z.string().uuid().safeParse(id).success || !statusSchema.safeParse(status).success) {
    return { ok: false, error: "Invalid update." };
  }
  const db = await getDb();
  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.id, id), eq(applications.userId, user.id)),
  });
  if (!existing) return { ok: false, error: "Application not found." };
  if (existing.status === status) return { ok: true, message: "Status unchanged." };

  await db
    .update(applications)
    .set({
      status,
      nextFollowUpAt: ["offer", "rejected", "ghosted", "withdrawn"].includes(status)
        ? null
        : existing.nextFollowUpAt,
      updatedAt: new Date(),
    })
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)));

  await db.insert(activities).values({
    userId: user.id,
    applicationId: id,
    type: status === "withdrawn" ? "withdrawn" : "status_changed",
    title: `Status updated to ${STATUS_LABELS[status]}`,
    description: `Changed from ${STATUS_LABELS[existing.status]} to ${STATUS_LABELS[status]}.`,
    metadata: { from: existing.status, to: status },
    occurredAt: new Date(),
  });
  revalidateApplication(id);
  return { ok: true, message: `Status updated to ${STATUS_LABELS[status]}.` };
}

export async function logEmailAction(input: {
  applicationId: string;
  direction: EmailDirection;
  kind: EmailKind;
  subject: string;
  body: string;
  occurredAt?: string;
}): Promise<ActionResponse> {
  const user = await requireUser();
  const parsed = z
    .object({
      applicationId: z.string().uuid(),
      direction: emailDirectionSchema,
      kind: emailKindSchema,
      subject: z.string().trim().min(1, "Subject is required.").max(400),
      body: z.string().trim().min(1, "Email body is required.").max(60000),
      occurredAt: z.string().optional(),
    })
    .safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Complete the email details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;
  const db = await getDb();
  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.id, data.applicationId), eq(applications.userId, user.id)),
  });
  if (!existing) return { ok: false, error: "Application not found." };

  const occurredAt = parseDateTimeLocal(data.occurredAt);
  const [email] = await db
    .insert(emailInteractions)
    .values({
      userId: user.id,
      applicationId: data.applicationId,
      direction: data.direction,
      kind: data.kind,
      subject: data.subject.trim(),
      body: data.body.trim(),
      fromEmail: data.direction === "outbound" ? user.email : existing.contactEmail,
      toEmail: data.direction === "outbound" ? existing.contactEmail : user.email,
      occurredAt,
    })
    .returning();

  await db.insert(activities).values({
    userId: user.id,
    applicationId: data.applicationId,
    emailId: email.id,
    type: emailActivityType(data.direction, data.kind),
    title: emailActivityTitle(data.direction, data.kind),
    description: email.subject.trim(),
    occurredAt,
  });

  let nextStatus = existing.status;
  if (data.direction === "inbound") {
    nextStatus = statusAfterInbound(data.kind, existing.status);
  } else if (data.kind === "follow_up") {
    if (["applied", "awaiting_response", "follow_up_due", "replied"].includes(existing.status)) {
      nextStatus = "awaiting_response";
    }
  }

  const userSettings = await db.query.settings.findFirst({ where: eq(settings.userId, user.id) });
  const intervals = userSettings?.followUpIntervals ?? [5, 10, 17];
  let nextFollowUpAt = existing.nextFollowUpAt;

  if (data.direction === "outbound" && data.kind === "follow_up") {
    nextFollowUpAt = ACTIVE_STATUSES.includes(nextStatus)
      ? getNextFollowUpDate(existing.appliedAt, intervals, toDateOnly(occurredAt))
      : null;
  } else if (data.direction === "inbound") {
    if (["interview", "assessment", "offer", "rejected"].includes(nextStatus)) {
      nextFollowUpAt = null;
    } else if (nextStatus === "replied") {
      nextFollowUpAt = getNextFollowUpDate(existing.appliedAt, intervals, toDateOnly(occurredAt));
    }
  }

  await db
    .update(applications)
    .set({
      lastContactAt: occurredAt,
      firstResponseAt:
        data.direction === "inbound" && !existing.firstResponseAt
          ? occurredAt
          : existing.firstResponseAt,
      status: nextStatus,
      nextFollowUpAt,
      updatedAt: new Date(),
    })
    .where(and(eq(applications.id, data.applicationId), eq(applications.userId, user.id)));

  if (nextStatus !== existing.status) {
    await db.insert(activities).values({
      userId: user.id,
      applicationId: data.applicationId,
      type: nextStatus === "withdrawn" ? "withdrawn" : "status_changed",
      title: `Status updated to ${STATUS_LABELS[nextStatus]}`,
      description: `Changed from ${STATUS_LABELS[existing.status]} to ${STATUS_LABELS[nextStatus]}.`,
      metadata: { from: existing.status, to: nextStatus },
      occurredAt: new Date(occurredAt.getTime() + 60_000),
    });
  }

  if (nextFollowUpAt && nextFollowUpAt !== existing.nextFollowUpAt) {
    await db.insert(activities).values({
      userId: user.id,
      applicationId: data.applicationId,
      type: "follow_up_scheduled",
      title: "Follow-up scheduled",
      description: `Next follow-up planned for ${formatDate(nextFollowUpAt)}.`,
      occurredAt: new Date(occurredAt.getTime() + 2 * 60_000),
    });
  }

  revalidateApplication(data.applicationId);
  return { ok: true, message: data.direction === "inbound" ? "Reply recorded." : "Email logged." };
}

export async function addNoteAction(applicationId: string, note: string): Promise<ActionResponse> {
  const user = await requireUser();
  if (!note.trim()) return { ok: false, error: "Write a note first." };
  if (note.length > 5000) return { ok: false, error: "That note is too long." };
  const db = await getDb();
  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, user.id)),
  });
  if (!existing) return { ok: false, error: "Application not found." };
  await db.insert(activities).values({
    userId: user.id,
    applicationId,
    type: "note_added",
    title: "Note added",
    description: note.trim(),
    occurredAt: new Date(),
  });
  revalidateApplication(applicationId);
  return { ok: true, message: "Note added." };
}

export async function scheduleFollowUpAction(
  applicationId: string,
  date: string,
): Promise<ActionResponse> {
  const user = await requireUser();
  if (!dateString.safeParse(date).success) return { ok: false, error: "Choose a valid date." };
  const db = await getDb();
  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, user.id)),
  });
  if (!existing) return { ok: false, error: "Application not found." };
  await db
    .update(applications)
    .set({ nextFollowUpAt: date, updatedAt: new Date() })
    .where(and(eq(applications.id, applicationId), eq(applications.userId, user.id)));
  await db.insert(activities).values({
    userId: user.id,
    applicationId,
    type: "follow_up_scheduled",
    title: "Follow-up scheduled",
    description: `Follow-up set for ${formatDate(date)}.`,
    occurredAt: new Date(),
  });
  revalidateApplication(applicationId);
  return { ok: true, message: "Follow-up scheduled." };
}

export async function bulkDeleteApplicationsAction(ids: string[]): Promise<ActionResponse> {
  const user = await requireUser();
  const validIds = ids.filter((id) => z.string().uuid().safeParse(id).success);
  if (!validIds.length) return { ok: false, error: "Select at least one application." };
  const db = await getDb();
  const deleted = await db
    .delete(applications)
    .where(and(eq(applications.userId, user.id), inArray(applications.id, validIds)))
    .returning({ id: applications.id });
  revalidateApplication();
  return { ok: true, message: `${deleted.length} application${deleted.length === 1 ? "" : "s"} deleted.` };
}

export async function bulkUpdateStatusAction(
  ids: string[],
  status: ApplicationStatus,
): Promise<ActionResponse> {
  const user = await requireUser();
  const validIds = ids.filter((id) => z.string().uuid().safeParse(id).success);
  if (!validIds.length || !statusSchema.safeParse(status).success) {
    return { ok: false, error: "Invalid update." };
  }
  const db = await getDb();
  const existing = await db
    .select()
    .from(applications)
    .where(and(eq(applications.userId, user.id), inArray(applications.id, validIds)));

  for (const app of existing) {
    if (app.status === status) continue;
    await db
      .update(applications)
      .set({
        status,
        nextFollowUpAt: ["offer", "rejected", "ghosted", "withdrawn"].includes(status)
          ? null
          : app.nextFollowUpAt,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, app.id));
    await db.insert(activities).values({
      userId: user.id,
      applicationId: app.id,
      type: status === "withdrawn" ? "withdrawn" : "status_changed",
      title: `Status updated to ${STATUS_LABELS[status]}`,
      description: `Changed from ${STATUS_LABELS[app.status]} to ${STATUS_LABELS[status]}.`,
      metadata: { from: app.status, to: status },
      occurredAt: new Date(),
    });
  }
  revalidateApplication();
  return { ok: true, message: `Updated ${existing.length} applications.` };
}

const templateSchema = z.object({
  name: z.string().trim().min(1, "Name your template.").max(120),
  kind: templateKindSchema,
  subject: z.string().trim().min(1, "Add a subject line.").max(400),
  body: z.string().trim().min(1, "Add a message body.").max(30000),
});

export async function createTemplateAction(input: {
  name: string;
  kind: TemplateKind;
  subject: string;
  body: string;
}): Promise<ActionResponse> {
  const user = await requireUser();
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the template." };
  }
  const db = await getDb();
  const [template] = await db
    .insert(templates)
    .values({ ...parsed.data, userId: user.id })
    .returning();
  revalidatePath("/templates");
  revalidatePath("/emails");
  return { ok: true, message: `${TEMPLATE_KIND_LABELS[template.kind]} template created.`, id: template.id };
}

export async function updateTemplateAction(input: {
  id: string;
  name: string;
  kind: TemplateKind;
  subject: string;
  body: string;
}): Promise<ActionResponse> {
  const user = await requireUser();
  const parsed = z.object({ id: z.string().uuid() }).and(templateSchema).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the template." };
  }
  const { id, ...data } = parsed.data;
  const db = await getDb();
  const updated = await db
    .update(templates)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(templates.id, id), eq(templates.userId, user.id)))
    .returning({ id: templates.id });
  if (!updated.length) return { ok: false, error: "Template not found." };
  revalidatePath("/templates");
  revalidatePath("/emails");
  return { ok: true, message: "Template updated." };
}

export async function deleteTemplateAction(id: string): Promise<ActionResponse> {
  const user = await requireUser();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid template." };
  const db = await getDb();
  const deleted = await db
    .delete(templates)
    .where(and(eq(templates.id, id), eq(templates.userId, user.id)))
    .returning({ id: templates.id });
  if (!deleted.length) return { ok: false, error: "Template not found." };
  revalidatePath("/templates");
  return { ok: true, message: "Template deleted." };
}

export async function updateSettingsAction(input: {
  followUpIntervals: number[];
  emailSignature?: string;
  defaultMethod: ApplicationMethod;
}): Promise<ActionResponse> {
  const user = await requireUser();
  const parsed = z
    .object({
      followUpIntervals: z.array(z.number().int().min(1).max(365)).min(1).max(8),
      emailSignature: z.string().max(3000).optional(),
      defaultMethod: methodSchema,
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your settings." };
  }
  const uniqueIntervals = Array.from(new Set(parsed.data.followUpIntervals)).sort((a, b) => a - b);
  if (!uniqueIntervals.length) return { ok: false, error: "Add at least one follow-up interval." };
  const db = await getDb();
  const existing = await db.query.settings.findFirst({ where: eq(settings.userId, user.id) });
  if (existing) {
    await db
      .update(settings)
      .set({
        followUpIntervals: uniqueIntervals,
        emailSignature: asNullable(parsed.data.emailSignature),
        defaultMethod: parsed.data.defaultMethod,
        updatedAt: new Date(),
      })
      .where(eq(settings.userId, user.id));
  } else {
    await db.insert(settings).values({
      userId: user.id,
      followUpIntervals: uniqueIntervals,
      emailSignature: asNullable(parsed.data.emailSignature),
      defaultMethod: parsed.data.defaultMethod,
    });
  }
  revalidatePath("/settings");
  revalidatePath("/applications");
  return { ok: true, message: "Settings saved." };
}

export async function updateCompanyAction(input: {
  id: string;
  website?: string | null;
  notes?: string | null;
}): Promise<ActionResponse> {
  const user = await requireUser();
  if (!z.string().uuid().safeParse(input.id).success) return { ok: false, error: "Invalid company." };
  const db = await getDb();
  const website = normalizeWebsite(input.website);
  const updated = await db
    .update(companies)
    .set({
      website,
      domain: domainFromWebsite(website),
      notes: asNullable(input.notes),
      updatedAt: new Date(),
    })
    .where(and(eq(companies.id, input.id), eq(companies.userId, user.id)))
    .returning({ id: companies.id });
  if (!updated.length) return { ok: false, error: "Company not found." };
  revalidatePath("/companies");
  return { ok: true, message: "Company updated." };
}

export async function updateApplicationNotesAction(
  id: string,
  notes: string,
): Promise<ActionResponse> {
  const user = await requireUser();
  const db = await getDb();
  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.id, id), eq(applications.userId, user.id)),
  });
  if (!existing) return { ok: false, error: "Application not found." };
  await db
    .update(applications)
    .set({ notes: asNullable(notes), updatedAt: new Date() })
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)));
  await db.insert(activities).values({
    userId: user.id,
    applicationId: id,
    type: "note_added",
    title: "Notes updated",
    description: asNullable(notes),
    occurredAt: new Date(),
  });
  revalidateApplication(id);
  return { ok: true, message: "Notes saved." };
}
