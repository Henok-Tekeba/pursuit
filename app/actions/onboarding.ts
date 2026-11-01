"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ensureUserWorkspace, findUserByEmail, normalizeEmail } from "@/lib/auth/helpers";
import { requireUser, setSessionCookie } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OnboardingState = {
  status: "idle" | "error";
  message?: string;
};

export async function completeOnboardingAction(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    redirect("/signup?error=verify-required");
  }

  const email = normalizeEmail(authUser.email);
  const name = String(formData.get("name") ?? "").trim();
  const targetRole = String(formData.get("targetRole") ?? "").trim();
  const university = String(formData.get("university") ?? "").trim();
  const graduationYear = String(formData.get("graduationYear") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const provider = String(authUser.app_metadata?.provider ?? "email");
  const passwordRequired = provider !== "google";

  if (name.length < 2 || name.length > 80) {
    return { status: "error", message: "Enter your full name." };
  }
  if (targetRole.length > 120 || university.length > 160 || location.length > 120) {
    return { status: "error", message: "One of your profile fields is too long." };
  }
  if (graduationYear && !/^\d{4}$/.test(graduationYear)) {
    return { status: "error", message: "Enter a four-digit graduation year." };
  }
  if (passwordRequired && password.length < 8) {
    return { status: "error", message: "Create a password with at least 8 characters." };
  }
  if (password && (password.length < 8 || password.length > 200)) {
    return { status: "error", message: "Use a password between 8 and 200 characters." };
  }
  if (password !== confirmPassword) {
    return { status: "error", message: "Those passwords don't match." };
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    await setSessionCookie(existing.id, existing.email, existing.isDemo);
    redirect("/dashboard");
  }

  let passwordHash: string | null = null;
  if (password) {
    passwordHash = await hashPassword(password);
  }

  const db = await getDb();
  let created;

  try {
    const inserted = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        targetRole: targetRole || null,
        university: university || null,
        graduationYear: graduationYear || null,
        location: location || null,
        onboardedAt: new Date(),
      })
      .returning();
    created = inserted[0];
    await ensureUserWorkspace(created);
  } catch (error) {
    console.error("Onboarding insert failed", error);
    const raceWinner = await findUserByEmail(email);
    if (!raceWinner) {
      return {
        status: "error",
        message: "We couldn't finish your account setup. Please try again.",
      };
    }
    created = raceWinner;
  }

  await setSessionCookie(created.id, created.email, created.isDemo);

  try {
    await supabase.auth.signOut();
  } catch {
    // The application session is already set; clearing the Supabase session is best effort.
  }

  redirect("/dashboard?welcome=1");
}

export async function completeExistingOnboardingAction(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const targetRole = String(formData.get("targetRole") ?? "").trim();
  const university = String(formData.get("university") ?? "").trim();
  const graduationYear = String(formData.get("graduationYear") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (name.length < 2 || name.length > 80) {
    return { status: "error", message: "Enter your full name." };
  }
  if (targetRole.length > 120 || university.length > 160 || location.length > 120) {
    return { status: "error", message: "One of your profile fields is too long." };
  }
  if (graduationYear && !/^\d{4}$/.test(graduationYear)) {
    return { status: "error", message: "Enter a four-digit graduation year." };
  }

  const db = await getDb();
  await db
    .update(users)
    .set({
      name,
      targetRole: targetRole || null,
      university: university || null,
      graduationYear: graduationYear || null,
      location: location || null,
      onboardedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  redirect("/dashboard?welcome=1");
}

export async function cancelOnboardingAction() {
  const supabase = await createSupabaseServerClient();
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore a missing or expired Supabase session.
  }
  redirect("/signup");
}
