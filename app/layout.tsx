import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "Internship Tracker — Your internship CRM",
    template: "%s · Internship Tracker",
  },
  description:
    "A calm, focused CRM for internship applications, cold emails, follow-ups, and interviews.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
