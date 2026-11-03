"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { authTokens, users } from "@/lib/db/schema";
import { normalizeEmail } from "@/lib/auth/helpers";
import { clearSessionCookie, requireUser, setSessionCookie } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { DEMO_EMAIL, isDemoLoginEnabled } from "@/lib/auth/demo";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

export type PasswordAuthState = {
  status: "idle" | "error";
  message?: string;
};

export type PasswordChangeState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const passwordAuthSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters for your password.")
    .max(200, "That password is too long."),
});

export async function passwordSignInAction(
  _previousState: PasswordAuthState,
  formData: FormData,
): Promise<PasswordAuthState> {
  const parsed = passwordAuthSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Enter your email and password.",
    };
  }

  const email = normalizeEmail(parsed.data.email);
  const ip = await getClientIp();
  const ipLimit = await consumeRateLimit(`login:ip:${ip}`, 30, 15 * 60);
  if (!ipLimit.allowed) {
    return {
      status: "error",
      message: "Too many sign-in attempts. Try again in a few minutes.",
    };
  }
  const emailLimit = await consumeRateLimit(`login:email:${email}`, 10, 15 * 60);
  if (!emailLimit.allowed) {
    return {
      status: "error",
      message: "Too many sign-in attempts for this account. Try again in a few minutes.",
    };
  }

  const db = await getDb();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (!user?.passwordHash) {
    return { status: "error", message: "Incorrect email or password." };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { status: "error", message: "Incorrect email or password." };
  }

  await setSessionCookie(user.id, user.email, user.isDemo);
  redirect("/dashboard");
}

export async function demoSignInAction() {
  if (!isDemoLoginEnabled()) {
    redirect("/login?error=demo-unavailable");
  }
  const ip = await getClientIp();
  const demoLimit = await consumeRateLimit(`demo:ip:${ip}`, 30, 60 * 60);
  if (!demoLimit.allowed) {
    redirect("/login?error=rate-limited");
  }
  const db = await getDb();
  const demoUser = await db.query.users.findFirst({
    where: eq(users.email, DEMO_EMAIL),
  });
  if (!demoUser) {
    redirect("/login?error=demo-unavailable");
  }
  await setSessionCookie(demoUser.id, demoUser.email, true);
  redirect("/dashboard");
}

export async function changePasswordAction(
  _previousState: PasswordChangeState,
  formData: FormData,
): Promise<PasswordChangeState> {
  const user = await requireUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (newPassword.length < 8) {
    return { status: "error", message: "Use at least 8 characters for your new password." };
  }
  if (newPassword.length > 200) {
    return { status: "error", message: "That password is too long." };
  }

  const db = await getDb();
  const current = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  if (!current) return { status: "error", message: "Your account could not be found." };

  if (current.passwordHash) {
    const valid = await verifyPassword(currentPassword, current.passwordHash);
    if (!valid) {
      return { status: "error", message: "Your current password is incorrect." };
    }
  }

  const passwordHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  return { status: "success", message: "Password updated." };
}


export async function deleteAccountAction(confirmEmail: string): Promise<{
  ok: false;
  error: string;
}> {
  const user = await requireUser();
  if (user.isDemo) {
    return { ok: false, error: "The demo workspace cannot be deleted." };
  }
  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return { ok: false, error: "Type your account email exactly to confirm." };
  }

  const db = await getDb();
  await db.delete(authTokens).where(eq(authTokens.email, user.email));
  await db.delete(users).where(eq(users.id, user.id));
  await clearSessionCookie();
  redirect("/");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const targetRole = String(formData.get("targetRole") ?? "").trim();
  const university = String(formData.get("university") ?? "").trim();
  const graduationYear = String(formData.get("graduationYear") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!name || name.length < 2) {
    return { ok: false, message: "Please enter your name." };
  }
  if (graduationYear && !/^\d{4}$/.test(graduationYear)) {
    return { ok: false, message: "Enter a four-digit graduation year." };
  }

  const db = await getDb();
  await db
    .update(users)
    .set({
      name,
      avatarUrl: avatarUrl || null,
      targetRole: targetRole || null,
      university: university || null,
      graduationYear: graduationYear || null,
      location: location || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  return { ok: true, message: "Profile updated." };
}
