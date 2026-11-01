"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  ensureUserWorkspace,
  findOrCreateUser,
  isSupabaseConfigured,
  issueMagicLink,
  normalizeEmail,
} from "@/lib/auth/helpers";
import { clearSessionCookie, requireUser, setSessionCookie } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl, getRequestBaseUrl } from "@/lib/url";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { DEMO_EMAIL, isDemoLoginEnabled } from "@/lib/auth/demo";

export type AuthFormState = {
  status: "idle" | "error" | "sent";
  message?: string;
  email?: string;
  devLink?: string;
  delivery?: "local" | "supabase";
};

const authSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  name: z.string().trim().optional(),
  intent: z.enum(["login", "signup"]).default("login"),
});

export async function sendSignInLink(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") ?? undefined,
    intent: formData.get("intent") ?? "login",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }

  const email = normalizeEmail(parsed.data.email);
  const name = parsed.data.name?.trim();
  const intent = parsed.data.intent;

  if (intent === "signup" && (!name || name.length < 2)) {
    return { status: "error", message: "Please enter your full name." };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const baseUrl = await getRequestBaseUrl();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${baseUrl}/auth/callback?next=/dashboard`,
          data: name ? { full_name: name } : undefined,
        },
      });
      if (error) {
        return { status: "error", message: error.message };
      }
      return { status: "sent", email, delivery: "supabase" };
    } catch (error) {
      console.error("Supabase magic link failed", error);
      return {
        status: "error",
        message: "We couldn't send your sign-in email. Please try again.",
      };
    }
  }

  const localDatabase = !process.env.DATABASE_URL?.trim();
  if (
    process.env.NODE_ENV === "production" &&
    !localDatabase &&
    process.env.DEV_SHOW_MAGIC_LINK !== "true"
  ) {
    return {
      status: "error",
      message:
        "Email delivery is not configured. Add Supabase Auth credentials to enable sign-in emails.",
    };
  }

  try {
    await findOrCreateUser(email, name);
    const token = await issueMagicLink(email);
    const baseUrl = localDatabase ? await getRequestBaseUrl() : getAppUrl();
    const devLink = `${baseUrl}/auth/verify?token=${token}`;
    return { status: "sent", email, delivery: "local", devLink };
  } catch (error) {
    console.error("Local magic link failed", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
}

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

const signUpSchema = passwordAuthSchema.extend({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
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
  const db = await getDb();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (!user?.passwordHash) {
    return { status: "error", message: "Incorrect email or password." };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { status: "error", message: "Incorrect email or password." };
  }

  await setSessionCookie(user.id, user.email);
  redirect("/dashboard");
}

export async function passwordSignUpAction(
  _previousState: PasswordAuthState,
  formData: FormData,
): Promise<PasswordAuthState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check your account details.",
    };
  }

  const email = normalizeEmail(parsed.data.email);
  const name = parsed.data.name.trim();
  const db = await getDb();
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return {
      status: "error",
      message:
        "An account with this email already exists. Sign in instead, or use a different email.",
    };
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const [user] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
      })
      .returning();
    await ensureUserWorkspace(user);
    await setSessionCookie(user.id, user.email);
    redirect("/dashboard");
  } catch (error) {
    console.error("Password signup failed", error);
    return {
      status: "error",
      message: "We couldn't create your account. Please try again.",
    };
  }
}

export async function demoSignInAction() {
  if (!isDemoLoginEnabled()) {
    redirect("/login?error=demo-unavailable");
  }
  const db = await getDb();
  const demoUser = await db.query.users.findFirst({
    where: eq(users.email, DEMO_EMAIL),
  });
  if (!demoUser) {
    redirect("/login?error=demo-unavailable");
  }
  await setSessionCookie(demoUser.id, demoUser.email);
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
  revalidatePath("/settings");
  return { status: "success", message: "Password updated." };
}

export async function signOutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  if (!name || name.length < 2) {
    return { ok: false, message: "Please enter your name." };
  }
  const db = await getDb();
  await db
    .update(users)
    .set({
      name,
      avatarUrl: avatarUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  return { ok: true, message: "Profile updated." };
}
