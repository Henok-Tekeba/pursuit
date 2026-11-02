import { cache } from "react";
import { and, asc, count, desc, eq, gt, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { getDb } from "@/lib/db";
import {
  activities,
  applications,
  companies,
  emailInteractions,
  settings,
  templates,
  type Application,
  type ApplicationMethod,
  type ApplicationStatus,
  type Company,
} from "@/lib/db/schema";
import {
  ACTIVE_STATUSES,
  INTERVIEW_STATUSES,
  STATUS_ORDER,
} from "@/lib/constants";
import { toDateOnly, todayDateOnly } from "@/lib/utils";

export type ApplicationListFilters = {
  query?: string;
  status?: string;
  method?: string;
  range?: string;
  sort?: string;
  followUp?: string;
  page?: number;
  pageSize?: number;
};

export type ApplicationListItem = {
  id: string;
  reference: string;
  companyId: string;
  companyName: string;
  companyWebsite: string | null;
  companyDomain: string | null;
  position: string;
  location: string | null;
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
  createdAt: string;
  updatedAt: string;
};

export function applicationReference(refNo: number) {
  return `APP-${String(1000 + refNo).padStart(4, "0")}`;
}

function mapListRow(row: { application: Application; company: Company }): ApplicationListItem {
  return {
    id: row.application.id,
    reference: applicationReference(row.application.refNo),
    companyId: row.company.id,
    companyName: row.company.name,
    companyWebsite: row.company.website,
    companyDomain: row.company.domain,
    position: row.application.position,
    location: row.application.location,
    contactName: row.application.contactName,
    contactEmail: row.application.contactEmail,
    contactAvatarUrl: row.application.contactAvatarUrl,
    method: row.application.method,
    status: row.application.status,
    appliedAt: row.application.appliedAt,
    lastContactAt: row.application.lastContactAt?.toISOString() ?? null,
    nextFollowUpAt: row.application.nextFollowUpAt,
    firstResponseAt: row.application.firstResponseAt?.toISOString() ?? null,
    notes: row.application.notes,
    createdAt: row.application.createdAt.toISOString(),
    updatedAt: row.application.updatedAt.toISOString(),
  };
}

const getWorkspaceItems = cache(async (userId: string) => {
  const db = await getDb();
  const rows = await db
    .select({ application: applications, company: companies })
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.updatedAt));

  return rows.map(mapListRow);
});

export async function getApplications(userId: string, filters: ApplicationListFilters = {}) {
  const db = await getDb();
  const {
    query,
    status,
    method,
    range,
    sort = "applied_desc",
    followUp,
    page = 1,
    pageSize = 10,
  } = filters;

  const conditions = [eq(applications.userId, userId)];
  const normalizedQuery = query?.trim();
  if (normalizedQuery) {
    const search = `%${normalizedQuery}%`;
    conditions.push(
      or(
        ilike(companies.name, search),
        ilike(applications.position, search),
        ilike(applications.contactName, search),
        ilike(applications.contactEmail, search),
        ilike(companies.website, search),
      )!,
    );
  }
  if (status && status !== "all") {
    conditions.push(eq(applications.status, status as ApplicationStatus));
  }
  if (method && method !== "all") {
    conditions.push(eq(applications.method, method as ApplicationMethod));
  }
  if (range && range !== "all") {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 0;
    if (days) {
      conditions.push(gte(applications.appliedAt, toDateOnly(addDays(new Date(), -days))));
    }
  }
  if (followUp === "due") {
    conditions.push(
      and(
        inArray(applications.status, ACTIVE_STATUSES),
        lte(applications.nextFollowUpAt, todayDateOnly()),
      )!,
    );
  } else if (followUp === "upcoming") {
    conditions.push(
      and(
        inArray(applications.status, ACTIVE_STATUSES),
        gt(applications.nextFollowUpAt, todayDateOnly()),
      )!,
    );
  }

  const where = and(...conditions);
  const orderBy =
    sort === "applied_asc"
      ? [asc(applications.appliedAt), asc(applications.refNo)]
      : sort === "company_asc"
        ? [asc(companies.name), desc(applications.appliedAt)]
        : sort === "company_desc"
          ? [desc(companies.name), desc(applications.appliedAt)]
          : sort === "follow_up"
            ? [sql`${applications.nextFollowUpAt} asc nulls last`, desc(applications.appliedAt)]
            : [desc(applications.appliedAt), desc(applications.refNo)];

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) ? Math.min(Math.max(Math.floor(pageSize), 1), 100) : 10;

  const [rows, totalRow] = await Promise.all([
    db
      .select({ application: applications, company: companies })
      .from(applications)
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(where)
      .orderBy(...orderBy)
      .limit(safePageSize)
      .offset((safePage - 1) * safePageSize),
    db
      .select({ value: count() })
      .from(applications)
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(where),
  ]);

  const total = Number(totalRow[0]?.value ?? 0);
  return {
    items: rows.map(mapListRow),
    total,
    page: safePage,
    pageSize: safePageSize,
    pageCount: Math.max(1, Math.ceil(total / safePageSize)),
  };
}

export async function getApplicationsForExport(userId: string, filters: ApplicationListFilters = {}) {
  const result = await getApplications(userId, { ...filters, page: 1, pageSize: 100 });
  return result.items;
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData(userId: string) {
  const items = await getWorkspaceItems(userId);
  const today = todayDateOnly();
  const total = items.length;
  const responses = items.filter((item) => item.firstResponseAt !== null).length;
  const interviews = items.filter((item) => item.status === "interview").length;
  const offers = items.filter((item) => item.status === "offer").length;
  const active = items.filter((item) => ACTIVE_STATUSES.includes(item.status)).length;

  const dueFollowUps = items
    .filter(
      (item) =>
        ACTIVE_STATUSES.includes(item.status) &&
        item.nextFollowUpAt !== null &&
        item.nextFollowUpAt <= today,
    )
    .sort((a, b) => (a.nextFollowUpAt ?? "").localeCompare(b.nextFollowUpAt ?? ""));

  const upcomingFollowUps = items
    .filter(
      (item) =>
        ACTIVE_STATUSES.includes(item.status) &&
        item.nextFollowUpAt !== null &&
        item.nextFollowUpAt > today &&
        differenceInCalendarDays(parseISO(item.nextFollowUpAt), parseISO(today)) <= 7,
    )
    .sort((a, b) => (a.nextFollowUpAt ?? "").localeCompare(b.nextFollowUpAt ?? ""));

  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    count: items.filter((item) => item.status === status).length,
  }));

  const recent = [...items]
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
    .slice(0, 6);

  const responseRate = total ? Math.round((responses / total) * 100) : 0;
  const interviewRate = total ? Math.round((interviews / total) * 100) : 0;

  return {
    items,
    total,
    responses,
    interviews,
    offers,
    active,
    dueFollowUps,
    upcomingFollowUps,
    statusCounts,
    recent,
    responseRate,
    interviewRate,
    today,
  };
}

export type ApplicationStatusCount = { status: ApplicationStatus; count: number };

export async function getApplicationDetail(userId: string, id: string) {
  const db = await getDb();
  const row = await db
    .select({ application: applications, company: companies })
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .limit(1);

  if (!row.length) return null;

  const [emails, timeline, userSettings] = await Promise.all([
    db
      .select()
      .from(emailInteractions)
      .where(and(eq(emailInteractions.applicationId, id), eq(emailInteractions.userId, userId)))
      .orderBy(desc(emailInteractions.occurredAt)),
    db
      .select()
      .from(activities)
      .where(and(eq(activities.applicationId, id), eq(activities.userId, userId)))
      .orderBy(desc(activities.occurredAt), desc(activities.createdAt)),
    db.query.settings.findFirst({ where: eq(settings.userId, userId) }),
  ]);

  const application = row[0];
  return {
    ...mapListRow(application),
    firstResponseAt: application.application.firstResponseAt?.toISOString() ?? null,
    jobUrl: application.application.jobUrl,
    companyNotes: application.company.notes,
    companyCreatedAt: application.company.createdAt.toISOString(),
    emails: emails.map((email) => ({
      ...email,
      occurredAt: email.occurredAt.toISOString(),
      createdAt: email.createdAt.toISOString(),
    })),
    timeline: timeline.map((activity) => ({
      ...activity,
      occurredAt: activity.occurredAt.toISOString(),
      createdAt: activity.createdAt.toISOString(),
    })),
    settings: userSettings ?? null,
  };
}

export async function getFollowUpApplications(userId: string, view: "due" | "upcoming" | "all" = "due") {
  const data = await getDashboardData(userId);
  const today = data.today;
  const all = data.items
    .filter((item) => item.nextFollowUpAt !== null && !["offer", "rejected", "ghosted", "withdrawn"].includes(item.status))
    .sort((a, b) => (a.nextFollowUpAt ?? "").localeCompare(b.nextFollowUpAt ?? ""));
  const due = all.filter((item) => (item.nextFollowUpAt ?? "") <= today);
  const upcoming = all.filter((item) => (item.nextFollowUpAt ?? "") > today);
  if (view === "due") return { items: due, counts: { due: due.length, upcoming: upcoming.length, all: all.length } };
  if (view === "upcoming") return { items: upcoming, counts: { due: due.length, upcoming: upcoming.length, all: all.length } };
  return { items: all, counts: { due: due.length, upcoming: upcoming.length, all: all.length } };
}

export async function getEmailsForUser(
  userId: string,
  filters: { query?: string; direction?: string; kind?: string } = {},
) {
  const db = await getDb();
  const conditions = [eq(emailInteractions.userId, userId)];
  const q = filters.query?.trim();
  if (q) {
    const search = `%${q}%`;
    conditions.push(
      or(
        ilike(emailInteractions.subject, search),
        ilike(emailInteractions.body, search),
        ilike(companies.name, search),
        ilike(applications.position, search),
      )!,
    );
  }
  if (filters.direction && filters.direction !== "all") {
    conditions.push(eq(emailInteractions.direction, filters.direction as "outbound" | "inbound"));
  }
  if (filters.kind && filters.kind !== "all") {
    conditions.push(
      eq(
        emailInteractions.kind,
        filters.kind as
          | "initial"
          | "follow_up"
          | "reply"
          | "interview"
          | "assessment"
          | "offer"
          | "rejection"
          | "other",
      ),
    );
  }

  const rows = await db
    .select({
      email: emailInteractions,
      application: applications,
      company: companies,
    })
    .from(emailInteractions)
    .innerJoin(applications, eq(emailInteractions.applicationId, applications.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(and(...conditions))
    .orderBy(desc(emailInteractions.occurredAt))
    .limit(60);

  return rows.map(({ email, application, company }) => ({
    id: email.id,
    applicationId: application.id,
    companyName: company.name,
    companyDomain: company.domain,
    position: application.position,
    direction: email.direction,
    kind: email.kind,
    subject: email.subject,
    body: email.body,
    occurredAt: email.occurredAt.toISOString(),
    fromEmail: email.fromEmail,
    toEmail: email.toEmail,
    status: application.status,
  }));
}

export async function getCompaniesForUser(userId: string) {
  const db = await getDb();
  const rows = await db
    .select({ company: companies, application: applications })
    .from(companies)
    .leftJoin(applications, eq(applications.companyId, companies.id))
    .where(eq(companies.userId, userId))
    .orderBy(asc(companies.name));

  const map = new Map<
    string,
    {
      id: string;
      name: string;
      website: string | null;
      domain: string | null;
      notes: string | null;
      applicationCount: number;
      responseCount: number;
      activeCount: number;
      latestApplication: { id: string; position: string; status: ApplicationStatus; appliedAt: string } | null;
    }
  >();

  for (const row of rows) {
    const existing = map.get(row.company.id) ?? {
      id: row.company.id,
      name: row.company.name,
      website: row.company.website,
      domain: row.company.domain,
      notes: row.company.notes,
      applicationCount: 0,
      responseCount: 0,
      activeCount: 0,
      latestApplication: null,
    };
    if (row.application) {
      existing.applicationCount += 1;
      if (row.application.firstResponseAt) existing.responseCount += 1;
      if (ACTIVE_STATUSES.includes(row.application.status)) existing.activeCount += 1;
      if (
        !existing.latestApplication ||
        row.application.appliedAt > existing.latestApplication.appliedAt
      ) {
        existing.latestApplication = {
          id: row.application.id,
          position: row.application.position,
          status: row.application.status,
          appliedAt: row.application.appliedAt,
        };
      }
    }
    map.set(row.company.id, existing);
  }

  return Array.from(map.values());
}

export async function getTemplatesForUser(userId: string) {
  const db = await getDb();
  return db.select().from(templates).where(eq(templates.userId, userId)).orderBy(asc(templates.kind), desc(templates.updatedAt));
}

export async function getSettingsForUser(userId: string) {
  const db = await getDb();
  return db.query.settings.findFirst({ where: eq(settings.userId, userId) });
}

export async function getEmailsForApplication(userId: string, applicationId: string) {
  const db = await getDb();
  return db
    .select()
    .from(emailInteractions)
    .where(and(eq(emailInteractions.userId, userId), eq(emailInteractions.applicationId, applicationId)))
    .orderBy(desc(emailInteractions.occurredAt));
}

export async function getAnalytics(userId: string) {
  const db = await getDb();
  const [rows, emailRows, activityRows] = await Promise.all([
    db
      .select({ application: applications, company: companies })
      .from(applications)
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.appliedAt)),
    db
      .select({
        applicationId: emailInteractions.applicationId,
        direction: emailInteractions.direction,
        kind: emailInteractions.kind,
        occurredAt: emailInteractions.occurredAt,
      })
      .from(emailInteractions)
      .where(eq(emailInteractions.userId, userId)),
    db
      .select({
        applicationId: activities.applicationId,
        type: activities.type,
        metadata: activities.metadata,
      })
      .from(activities)
      .where(eq(activities.userId, userId)),
  ]);

  const items = rows.map(mapListRow);
  const total = items.length;
  const responses = items.filter((item) => item.firstResponseAt).length;
  const interviewApplications = new Set(
    items.filter((item) => INTERVIEW_STATUSES.includes(item.status)).map((item) => item.id),
  );
  const offerApplications = new Set(
    items.filter((item) => item.status === "offer").map((item) => item.id),
  );
  for (const activity of activityRows) {
    const to = activity.metadata?.to;
    if (
      activity.type === "interview_scheduled" ||
      (activity.type === "status_changed" &&
        (to === "interview" || to === "assessment" || to === "offer"))
    ) {
      interviewApplications.add(activity.applicationId);
    }
    if (activity.type === "offer_received" || (activity.type === "status_changed" && to === "offer")) {
      offerApplications.add(activity.applicationId);
    }
  }
  const interviews = interviewApplications.size;
  const offers = offerApplications.size;
  const responseRate = total ? Math.round((responses / total) * 100) : 0;
  const interviewRate = total ? Math.round((interviews / total) * 100) : 0;
  const offerRate = total ? Math.round((offers / total) * 100) : 0;

  const responseTimes = items
    .filter((item) => item.firstResponseAt)
    .map((item) => {
      const applied = parseISO(`${item.appliedAt}T00:00:00`);
      const responded = new Date(item.firstResponseAt!);
      return Math.max(0, differenceInCalendarDays(responded, applied));
    });
  const averageResponseDays = responseTimes.length
    ? Math.round((responseTimes.reduce((sum, days) => sum + days, 0) / responseTimes.length) * 10) / 10
    : 0;

  const followUpApps = new Set(
    emailRows.filter((email) => email.direction === "outbound" && email.kind === "follow_up").map((email) => email.applicationId),
  );
  const firstFollowUpByApp = new Map<string, Date>();
  for (const email of emailRows) {
    if (email.direction !== "outbound" || email.kind !== "follow_up") continue;
    const existing = firstFollowUpByApp.get(email.applicationId);
    if (!existing || email.occurredAt < existing) firstFollowUpByApp.set(email.applicationId, email.occurredAt);
  }
  const respondedAfterFollowUp = new Set<string>();
  for (const email of emailRows) {
    if (email.direction !== "inbound") continue;
    const firstFollowUp = firstFollowUpByApp.get(email.applicationId);
    if (firstFollowUp && email.occurredAt > firstFollowUp) respondedAfterFollowUp.add(email.applicationId);
  }
  const followUpEffectiveness = followUpApps.size
    ? Math.round((respondedAfterFollowUp.size / followUpApps.size) * 100)
    : 0;

  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    count: items.filter((item) => item.status === status).length,
  })).filter((entry) => entry.count > 0);

  const methodCounts = Array.from(
    items.reduce((map, item) => {
      map.set(item.method, (map.get(item.method) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).map(([method, count]) => ({ method, count }));

  const monthMap = new Map<string, number>();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, 0);
  }
  for (const item of items) {
    const key = item.appliedAt.slice(0, 7);
    if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }

  return {
    total,
    responses,
    interviews,
    offers,
    responseRate,
    interviewRate,
    offerRate,
    averageResponseDays,
    followUpEffectiveness,
    followUpsSent: followUpApps.size,
    respondedAfterFollowUp: respondedAfterFollowUp.size,
    statusCounts,
    methodCounts,
    monthly: Array.from(monthMap.entries()).map(([month, count]) => ({ month, count })),
    recentItems: items.slice(0, 8),
  };
}

export async function getShellData(userId: string) {
  const db = await getDb();
  const today = todayDateOnly();
  const [items, inboundRow] = await Promise.all([
    getWorkspaceItems(userId),
    db
      .select({ value: count() })
      .from(emailInteractions)
      .where(
        and(
          eq(emailInteractions.userId, userId),
          eq(emailInteractions.direction, "inbound"),
          gte(emailInteractions.occurredAt, addDays(new Date(), -30)),
        ),
      ),
  ]);

  const due = items
    .filter(
      (item) =>
        ACTIVE_STATUSES.includes(item.status) &&
        item.nextFollowUpAt !== null &&
        item.nextFollowUpAt <= today,
    )
    .sort((a, b) => (a.nextFollowUpAt ?? "").localeCompare(b.nextFollowUpAt ?? ""));
  const interviewCount = items.filter((item) => item.status === "interview").length;

  return {
    totalApplications: items.length,
    dueFollowUps: due,
    dueCount: due.length,
    inboundRecent: Number(inboundRow[0]?.value ?? 0),
    interviewCount,
    notificationCount: due.length,
    today,
  };
}

export async function searchApplications(userId: string, query: string) {
  const db = await getDb();
  const q = query.trim();
  if (!q) {
    return db
      .select({ application: applications, company: companies })
      .from(applications)
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.updatedAt))
      .limit(6)
      .then((rows) => rows.map(mapListRow));
  }
  const search = `%${q}%`;
  const rows = await db
    .select({ application: applications, company: companies })
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(
      and(
        eq(applications.userId, userId),
        or(
          ilike(companies.name, search),
          ilike(applications.position, search),
          ilike(applications.contactName, search),
          ilike(applications.contactEmail, search),
        )!,
      ),
    )
    .orderBy(desc(applications.updatedAt))
    .limit(8);
  return rows.map(mapListRow);
}

export async function getStatusCounts(userId: string): Promise<ApplicationStatusCount[]> {
  const db = await getDb();
  const rows = await db
    .select({ status: applications.status, value: count() })
    .from(applications)
    .where(eq(applications.userId, userId))
    .groupBy(applications.status);
  return rows.map((row) => ({ status: row.status, count: Number(row.value) }));
}
