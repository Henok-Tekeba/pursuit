import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: { absolute: "Pursuit: A calmer internship search" },
  description:
    "Track internship applications, emails, follow-ups, and interviews in one private, calm workspace.",
};

export default function HomePage() {
  return <LandingPage />;
}
