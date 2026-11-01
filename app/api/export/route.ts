import { NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { emailInteractions } from "@/lib/db/schema";
import { getDashboardData } from "@/lib/queries/applications";
import { METHOD_LABELS, STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function escapeCsv(value: string | null | undefined) {
  if (value === null || value === undefined) return "";
  const normalized = String(value).replace(/\r\n/g, "\n");
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }
  return normalized;
}

export async function GET(_request: NextRequest) {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const db = await getDb();
  const initialEmails = data.items.length
    ? await db
        .select({
          applicationId: emailInteractions.applicationId,
          subject: emailInteractions.subject,
          body: emailInteractions.body,
          occurredAt: emailInteractions.occurredAt,
        })
        .from(emailInteractions)
        .where(
          and(
            eq(emailInteractions.userId, user.id),
            inArray(
              emailInteractions.applicationId,
              data.items.map((item) => item.id),
            ),
            eq(emailInteractions.kind, "initial"),
          ),
        )
    : [];

  const initialByApp = new Map<string, { subject: string; body: string; occurredAt: string }>();
  for (const email of initialEmails) {
    if (!initialByApp.has(email.applicationId)) {
      initialByApp.set(email.applicationId, {
        subject: email.subject,
        body: email.body,
        occurredAt: email.occurredAt.toISOString(),
      });
    }
  }

  const headers = [
    "Reference",
    "Company",
    "Website",
    "Position",
    "Location",
    "Contact name",
    "Contact email",
    "Application method",
    "Status",
    "Applied on",
    "Last contact",
    "Next follow-up",
    "First response",
    "Days since application",
    "Notes",
    "Initial email subject",
    "Initial email body",
    "Initial email sent at",
  ];

  const rows = [...data.items]
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
    .map((item) => {
      const initial = initialByApp.get(item.id);
      return [
        item.reference,
        item.companyName,
        item.companyWebsite ?? "",
        item.position,
        item.location ?? "",
        item.contactName ?? "",
        item.contactEmail ?? "",
        METHOD_LABELS[item.method],
        STATUS_LABELS[item.status],
        formatDate(item.appliedAt),
        item.lastContactAt ? formatDate(item.lastContactAt) : "",
        item.nextFollowUpAt ? formatDate(item.nextFollowUpAt) : "",
        item.firstResponseAt ? formatDate(item.firstResponseAt) : "",
        String(
          Math.max(
            0,
            Math.floor(
              (new Date().getTime() - new Date(`${item.appliedAt}T00:00:00`).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          ),
        ),
        item.notes ?? "",
        initial?.subject ?? "",
        initial?.body ?? "",
        initial?.occurredAt ? formatDate(initial.occurredAt, "yyyy-MM-dd HH:mm") : "",
      ].map(escapeCsv);
    });

  const csv = [headers.map(escapeCsv).join(","), ...rows.map((row) => row.join(","))].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="internship-applications-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
