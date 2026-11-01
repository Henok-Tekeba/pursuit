import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { absolute: "Pursuit — The calm internship CRM" },
  description:
    "Track internship applications, emails, follow-ups, and interviews in one private, calm workspace.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  return <LandingPage isAuthed={Boolean(user)} />;
}
