import "server-only";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { settings, users, type User } from "@/lib/db/schema";

export function createCalendarToken() {
  return randomBytes(32).toString("base64url");
}

export async function ensureCalendarToken(userId: string) {
  const db = await getDb();
  const current = await db.query.settings.findFirst({
    where: eq(settings.userId, userId),
  });

  if (current?.calendarToken) return current.calendarToken;

  const token = createCalendarToken();
  if (current) {
    await db
      .update(settings)
      .set({ calendarToken: token, updatedAt: new Date() })
      .where(eq(settings.userId, userId));
  } else {
    await db.insert(settings).values({ userId, calendarToken: token });
  }
  return token;
}

export async function regenerateCalendarToken(userId: string) {
  const db = await getDb();
  const token = createCalendarToken();
  const current = await db.query.settings.findFirst({
    where: eq(settings.userId, userId),
  });

  if (current) {
    await db
      .update(settings)
      .set({ calendarToken: token, updatedAt: new Date() })
      .where(eq(settings.userId, userId));
  } else {
    await db.insert(settings).values({ userId, calendarToken: token });
  }
  return token;
}

export async function getUserForCalendarToken(token: string): Promise<User | null> {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) return null;

  const db = await getDb();
  const row = await db
    .select({ user: users })
    .from(settings)
    .innerJoin(users, eq(settings.userId, users.id))
    .where(eq(settings.calendarToken, token))
    .limit(1);

  return row[0]?.user ?? null;
}
