import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleSignup } from "@/components/auth/google-signup";
import { getSocialProviders } from "@/lib/auth/providers";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create your account" };
export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const socialProviders = await getSocialProviders();
  return (
    <AuthShell>
      <GoogleSignup googleEnabled={socialProviders.google} />
    </AuthShell>
  );
}
