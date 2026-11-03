import "server-only";
import { notFound } from "next/navigation";
import type { User } from "@/lib/db/schema";
import { isAdminEmail } from "./admin-emails";
import { getCurrentUser } from "./session";

export { isAdminEmail };

export async function getAdminUser(): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user || user.isDemo || !isAdminEmail(user.email)) return null;
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser();
  if (!user) notFound();
  return user;
}
