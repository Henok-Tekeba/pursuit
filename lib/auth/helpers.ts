import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { settings, templates, users, type User } from "@/lib/db/schema";
import { DEFAULT_TEMPLATES } from "@/lib/defaults";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function ensureUserWorkspace(user: User) {
  const db = await getDb();
  const existingSettings = await db.query.settings.findFirst({
    where: eq(settings.userId, user.id),
  });
  if (!existingSettings) {
    await db.insert(settings).values({ userId: user.id });
  }

  const existingTemplates = await db.query.templates.findFirst({
    where: eq(templates.userId, user.id),
  });
  if (!existingTemplates) {
    await db.insert(templates).values(
      DEFAULT_TEMPLATES.map((template) => ({
        ...template,
        userId: user.id,
      })),
    );
  }
}

export async function findUserByEmail(email: string) {
  const db = await getDb();
  return db.query.users.findFirst({
    where: eq(users.email, normalizeEmail(email)),
  });
}


