import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { isSupabaseConfigured } from "@/lib/auth/helpers";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Sign up" };
export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const { error } = await searchParams;
  return (
    <AuthShell>
      <AuthForm mode="signup" socialEnabled={isSupabaseConfigured()} initialError={error} />
    </AuthShell>
  );
}
