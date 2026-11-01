import type { Metadata } from "next";
import "./globals.css";
import "driver.js/dist/driver.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "Pursuit — Your internship CRM",
    template: "%s · Pursuit",
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
