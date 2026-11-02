import { and, asc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { applications, companies, type ApplicationStatus } from "@/lib/db/schema";

const FOLLOW_UP_STATUSES: ApplicationStatus[] = [
  "applied",
  "awaiting_response",
  "follow_up_due",
];

export type CalendarFollowUp = {
  id: string;
  companyName: string;
  position: string;
  status: ApplicationStatus;
  appliedAt: string;
  lastContactAt: string | null;
  nextFollowUpAt: string;
};

/**
 * Follow-ups that still need an external reminder:
 * scheduled, open, and with no inbound reply recorded.
 */
export async function getCalendarFollowUps(userId: string): Promise<CalendarFollowUp[]> {
  const db = await getDb();
  const rows = await db
    .select({
      application: applications,
      company: companies,
    })
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(
      and(
        eq(applications.userId, userId),
        isNotNull(applications.nextFollowUpAt),
      ),
    )
    .orderBy(asc(applications.nextFollowUpAt));

  return rows
    .filter(
      (row) =>
        row.application.nextFollowUpAt !== null &&
        row.application.firstResponseAt === null &&
        FOLLOW_UP_STATUSES.includes(row.application.status),
    )
    .map((row) => ({
      id: row.application.id,
      companyName: row.company.name,
      position: row.application.position,
      status: row.application.status,
      appliedAt: row.application.appliedAt,
      lastContactAt: row.application.lastContactAt?.toISOString() ?? null,
      nextFollowUpAt: row.application.nextFollowUpAt!,
    }));
}
