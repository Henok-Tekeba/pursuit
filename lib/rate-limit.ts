import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function getClientIp() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerList.get("x-real-ip") || "unknown";
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
) {
  const db = await getDb();
  const resetAt = new Date(Date.now() + windowSeconds * 1_000);
  const [row] = await db
    .insert(rateLimits)
    .values({ key: hashKey(key), count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} <= now() then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} <= now() then now() + (${windowSeconds} * interval '1 second') else ${rateLimits.resetAt} end`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });

  if (!row) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    resetAt: row.resetAt,
  };
}
