import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { DEMO_EMAIL, isDemoLoginEnabled } from "@/lib/auth/demo";
import { getCurrentUser, setSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const current = await getCurrentUser();
  if (current) redirect("/dashboard");
  if (!isDemoLoginEnabled()) redirect("/login?error=demo-unavailable");

  const db = await getDb();
  const demoUser = await db.query.users.findFirst({
    where: eq(users.email, DEMO_EMAIL),
  });
  if (!demoUser) redirect("/login?error=demo-unavailable");

  await setSessionCookie(demoUser.id, demoUser.email, true);
  redirect("/dashboard");
}
