import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { getSocialProviders } from "@/lib/auth/providers";
import { isDemoLoginEnabled } from "@/lib/auth/demo";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const { error } = await searchParams;
  const socialProviders = await getSocialProviders();
  return (
    <AuthShell>
      <AuthForm
        mode="login"
        socialProviders={socialProviders}
        initialError={error}
        demoEnabled={isDemoLoginEnabled()}
      />
    </AuthShell>
  );
}
