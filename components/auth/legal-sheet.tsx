"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const content = {
  terms: {
    title: "Terms of use",
    description: "The short version",
    body: [
      "Pursuit is a personal tool for organizing your own internship applications, emails, and follow-ups.",
      "You are responsible for the content you add and for making sure your outreach is honest and appropriate. The service is provided as-is, without guarantees of hiring outcomes.",
      "You may export or delete your data at any time. Do not use the service to store sensitive information you would not put in an email.",
    ],
  },
  privacy: {
    title: "Privacy",
    description: "Your data belongs to you",
    body: [
      "Your application records are private to your account. We never show them to other users.",
      "Your data is stored in a PostgreSQL database. Authentication is handled by Supabase Auth in production, or a local development sign-in flow when Supabase is not configured.",
      "You can export a CSV of your applications at any time. To request deletion of your account and data, email tekebahenok6@gmail.com.",
    ],
  },
};

export function LegalSheet({
  type,
  onOpenChange,
}: {
  type: "terms" | "privacy" | null;
  onOpenChange: (open: boolean) => void;
}) {
  const selected = type ? content[type] : null;
  return (
    <Dialog open={Boolean(type)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {selected && (
          <>
            <DialogHeader>
              <DialogTitle>{selected.title}</DialogTitle>
              <DialogDescription>{selected.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 border-t border-line pt-4 text-[13px] leading-relaxed text-ink-secondary">
              {selected.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
