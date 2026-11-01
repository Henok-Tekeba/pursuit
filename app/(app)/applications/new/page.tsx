import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getSettingsForUser, getTemplatesForUser } from "@/lib/queries/applications";
import { ApplicationForm } from "@/components/applications/application-form";

export const metadata: Metadata = { title: "New application" };
export const dynamic = "force-dynamic";

export default async function NewApplicationPage() {
  const user = await requireUser();
  const [settings, templates] = await Promise.all([
    getSettingsForUser(user.id),
    getTemplatesForUser(user.id),
  ]);

  return (
    <ApplicationForm
      mode="create"
      followUpIntervals={settings?.followUpIntervals ?? [5, 10, 17]}
      templates={templates}
      defaultMethod={settings?.defaultMethod ?? "cold_email"}
      myName={user.name}
      myEmail={user.email}
    />
  );
}
