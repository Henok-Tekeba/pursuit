import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { activities, applications, users } from "@/lib/db/schema";
import { getDb } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function latestDate(...values: Array<Date | null | undefined>): Date | null {
  let latest: Date | null = null;
  for (const value of values) {
    if (!value) continue;
    if (!latest || value.getTime() > latest.getTime()) latest = value;
  }
  return latest;
}

function utcDayStart(offsetDays = 0) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  onboardedAt: Date | null;
  targetRole: string | null;
  university: string | null;
  applicationCount: number;
  lastActiveAt: Date;
};

export type AdminOverview = {
  totals: {
    users: number;
    onboarded: number;
    new7: number;
    new30: number;
  };
  applications: {
    total: number;
    activeUsers: number;
    new7: number;
  };
  users: AdminUserRow[];
  dailySignups: Array<{
    date: Date;
    label: string;
    count: number;
  }>;
};

export async function getAdminOverview({ userLimit = 100 } = {}): Promise<AdminOverview> {
  const db = await getDb();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const chartStart = utcDayStart(-13);

  const [[userTotals], [applicationTotals], recentUsers, dailyRows] = await Promise.all([
    db
      .select({
        users: sql<number>`count(*)::int`,
        onboarded: sql<number>`count(*) filter (where ${users.onboardedAt} is not null)::int`,
        new7: sql<number>`count(*) filter (where ${users.createdAt} >= ${sevenDaysAgo.toISOString()}::timestamptz)::int`,
        new30: sql<number>`count(*) filter (where ${users.createdAt} >= ${thirtyDaysAgo.toISOString()}::timestamptz)::int`,
      })
      .from(users)
      .where(eq(users.isDemo, false)),
    db
      .select({
        total: sql<number>`count(*)::int`,
        activeUsers: sql<number>`count(distinct ${applications.userId})::int`,
        new7: sql<number>`count(*) filter (where ${applications.createdAt} >= ${sevenDaysAgo.toISOString()}::timestamptz)::int`,
      })
      .from(applications)
      .innerJoin(users, eq(applications.userId, users.id))
      .where(eq(users.isDemo, false)),
    db.query.users.findMany({
      where: eq(users.isDemo, false),
      orderBy: [desc(users.createdAt)],
      limit: userLimit,
    }),
    db
      .select({
        day: sql<string>`to_char(${users.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(and(eq(users.isDemo, false), sql`${users.createdAt} >= ${chartStart.toISOString()}::timestamptz`))
      .groupBy(sql`to_char(${users.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${users.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`),
  ]);

  const userIds = recentUsers.map((user) => user.id);

  const [applicationStats, activityStats] =
    userIds.length > 0
      ? await Promise.all([
          db
            .select({
              userId: applications.userId,
              total: sql<number>`count(*)::int`,
              lastAt: sql<string | null>`max(${applications.updatedAt})`,
            })
            .from(applications)
            .where(inArray(applications.userId, userIds))
            .groupBy(applications.userId),
          db
            .select({
              userId: activities.userId,
              lastAt: sql<string | null>`max(${activities.occurredAt})`,
            })
            .from(activities)
            .where(inArray(activities.userId, userIds))
            .groupBy(activities.userId),
        ])
      : [[], []];

  const applicationMap = new Map(
    applicationStats.map((row) => [
      row.userId,
      { total: Number(row.total), lastAt: toDate(row.lastAt) },
    ]),
  );
  const activityMap = new Map(
    activityStats.map((row) => [row.userId, toDate(row.lastAt)]),
  );

  const dailyMap = new Map(dailyRows.map((row) => [row.day, Number(row.count)]));
  const dailySignups = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(chartStart);
    date.setUTCDate(chartStart.getUTCDate() + index);
    return {
      date,
      label: formatDate(date, "MMM d"),
      count: dailyMap.get(dayKey(date)) ?? 0,
    };
  });

  const rows: AdminUserRow[] = recentUsers.map((user) => {
    const applicationStat = applicationMap.get(user.id);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      onboardedAt: user.onboardedAt,
      targetRole: user.targetRole,
      university: user.university,
      applicationCount: applicationStat?.total ?? 0,
      lastActiveAt:
        latestDate(user.updatedAt, user.createdAt, applicationStat?.lastAt, activityMap.get(user.id)) ??
        user.createdAt,
    };
  });

  return {
    totals: {
      users: Number(userTotals?.users ?? 0),
      onboarded: Number(userTotals?.onboarded ?? 0),
      new7: Number(userTotals?.new7 ?? 0),
      new30: Number(userTotals?.new30 ?? 0),
    },
    applications: {
      total: Number(applicationTotals?.total ?? 0),
      activeUsers: Number(applicationTotals?.activeUsers ?? 0),
      new7: Number(applicationTotals?.new7 ?? 0),
    },
    users: rows,
    dailySignups,
  };
}
