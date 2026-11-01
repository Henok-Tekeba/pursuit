import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms" };

const sections = [
  {
    heading: "The service",
    body: [
      "Pursuit is a personal workspace for organizing internship applications, outreach, follow-ups, and related notes. It is provided as a practical tool, not as career advice or a guarantee of interviews, offers, or employment outcomes.",
    ],
  },
  {
    heading: "Your content",
    body: [
      "You are responsible for the information you add and the messages you send. Keep your outreach honest and appropriate, and do not use Pursuit to store sensitive information you would not put in an email.",
      "You keep ownership of your content. You grant Pursuit only the access needed to store and display it back to you.",
    ],
  },
  {
    heading: "Your account",
    body: [
      "Keep your sign-in method secure. Do not share your account with another person or use the service to access someone else’s data.",
      "The demo workspace is sample data and may be changed by other visitors. Do not treat it as a private workspace.",
    ],
  },
  {
    heading: "Availability",
    body: [
      "Pursuit is provided as-is. Features may change, and the service may be unavailable during maintenance or provider outages. You can export your data at any time.",
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      "Do not attempt to access another user’s data, disrupt the service, or use it for unlawful or abusive activity. Accounts that do so may be suspended or removed.",
    ],
  },
  {
    heading: "Contact",
    body: ["Questions about these terms can be sent to tekebahenok6@gmail.com."],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      intro="The practical rules for using Pursuit. Keep it honest, keep your account secure, and export your data whenever you need it."
      sections={sections}
    />
  );
}
