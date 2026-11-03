import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy" };

const sections = [
  {
    heading: "What Pursuit stores",
    body: [
      "When you create an account, Pursuit stores your name and email address. If you choose to add them during onboarding or settings, it also stores your target role, school, graduation year, location, and avatar URL.",
      "Your workspace contains the applications, companies, contacts, emails, notes, templates, follow-up dates, and settings you add. Email content is stored exactly as you enter it so the conversation history stays intact.",
      "If you use Autofill, Pursuit requests the public job page you paste to read its title and job metadata. That page content is used only to prefill the application form for your review and is not stored as a separate document.",
    ],
  },
  {
    heading: "How authentication works",
    body: [
      "Account creation uses Google sign-in through Supabase Auth. Google verifies your email address before the account is created. Pursuit never receives your Google password.",
      "If you set a password, it is hashed with scrypt before storage. Sessions are signed, HTTP-only cookies.",
    ],
  },
  {
    heading: "Where data lives",
    body: [
      "Application data is stored in a PostgreSQL database hosted by Supabase. The application is deployed on Vercel. Production connections use TLS.",
      "Pursuit does not sell your data, serve advertising, or share your application records with other users. Every application query is scoped to the signed-in account.",
    ],
  },
  {
    heading: "Calendar feed",
    body: [
      "If you enable the calendar feed, Pursuit creates a private URL containing a random token. Anyone with that URL can read the follow-up events in it, so keep it private. You can regenerate the link in Settings at any time, which revokes the old one.",
      "Your calendar provider receives the company, role, date, status, and application link for each included event. The feed is not used for advertising or profiling.",
    ],
  },
  {
    heading: "Third-party job pages",
    body: [
      "When you use Autofill, Pursuit's server requests the job URL to read public page metadata. The destination site may see a request from Pursuit, but it does not receive your Pursuit session, Google credentials, or application data.",
    ],
  },
  {
    heading: "Export and deletion",
    body: [
      "You can export a CSV of your applications from the dashboard, applications page, or settings.",
      "You can permanently delete your workspace from Settings, under Danger zone. This removes your applications, emails, companies, templates, notes, settings, and calendar token from Pursuit. It does not delete your Google account.",
      "If you need help with deletion, email tekebahenok6@gmail.com from the address associated with the account. Include “Pursuit deletion” in the subject line.",
    ],
  },
  {
    heading: "Demo workspace",
    body: [
      "Elena’s demo workspace contains sample data and is shared for exploration. Do not enter personal or sensitive information into the demo account.",
    ],
  },
  {
    heading: "Contact",
    body: ["Questions about this policy can be sent to tekebahenok6@gmail.com."],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      intro="Pursuit is a personal internship tracker. This page explains what it stores, why it stores it, and how you stay in control."
      sections={sections}
    />
  );
}
