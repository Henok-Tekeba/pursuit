import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Finish your account" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const appUser = await getCurrentUser();
  if (appUser) {
    if (appUser.onboardedAt || appUser.isDemo) redirect("/dashboard");
    return (
      <AuthShell wide>
        <OnboardingForm
          mode="existing"
          email={appUser.email}
          initialName={appUser.name}
          provider="existing"
          initialProfile={{
            targetRole: appUser.targetRole,
            university: appUser.university,
            graduationYear: appUser.graduationYear,
            location: appUser.location,
          }}
        />
      </AuthShell>
    );
  }

  if (!isSupabaseConfigured()) {
    redirect("/signup?error=verification-unavailable");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/signup?error=verify-required");
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "";
  const provider = String(user.app_metadata?.provider ?? "email");

  return (
    <AuthShell wide>
      <OnboardingForm email={user.email} initialName={fullName} provider={provider} />
    </AuthShell>
  );
}
