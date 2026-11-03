import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { DEMO_EMAIL, isDemoLoginEnabled } from "@/lib/auth/demo";
import { getCurrentUser, setSessionCookie } from "@/lib/auth/session";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const current = await getCurrentUser();
  if (current) redirect("/dashboard");
  if (!isDemoLoginEnabled()) redirect("/login?error=demo-unavailable");

  const ip = await getClientIp();
  const demoLimit = await consumeRateLimit(`demo:ip:${ip}`, 30, 60 * 60);
  if (!demoLimit.allowed) redirect("/login?error=rate-limited");

  const db = await getDb();
  const demoUser = await db.query.users.findFirst({
    where: eq(users.email, DEMO_EMAIL),
  });
  if (!demoUser) redirect("/login?error=demo-unavailable");

  await setSessionCookie(demoUser.id, demoUser.email, true);
  redirect("/dashboard");
}
