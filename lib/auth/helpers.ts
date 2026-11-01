import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { authTokens, settings, templates, users, type User } from "@/lib/db/schema";
import { DEFAULT_TEMPLATES } from "@/lib/defaults";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function tokensMatch(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
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

export async function findOrCreateUser(email: string, name?: string) {
  const db = await getDb();
  const normalized = normalizeEmail(email);
  let user = await db.query.users.findFirst({
    where: eq(users.email, normalized),
  });
  if (!user) {
    const fallbackName = normalized
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
    const inserted = await db
      .insert(users)
      .values({ email: normalized, name: name?.trim() || fallbackName })
      .returning();
    user = inserted[0];
  }
  await ensureUserWorkspace(user);
  return user;
}

export async function issueMagicLink(email: string) {
  const db = await getDb();
  const normalized = normalizeEmail(email);
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 20);

  await db.delete(authTokens).where(and(eq(authTokens.email, normalized), isNull(authTokens.usedAt)));
  await db.insert(authTokens).values({
    email: normalized,
    tokenHash,
    expiresAt,
    purpose: "login",
  });

  return token;
}

export async function consumeMagicLink(token: string) {
  const db = await getDb();
  const tokenHash = hashToken(token);
  const record = await db.query.authTokens.findFirst({
    where: and(
      eq(authTokens.tokenHash, tokenHash),
      isNull(authTokens.usedAt),
      gt(authTokens.expiresAt, new Date()),
    ),
  });
  if (!record) return null;
  if (!tokensMatch(record.tokenHash, tokenHash)) return null;

  const updated = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(eq(authTokens.id, record.id))
    .returning({ id: authTokens.id, email: authTokens.email });
  if (!updated.length) return null;
  return updated[0].email;
}
