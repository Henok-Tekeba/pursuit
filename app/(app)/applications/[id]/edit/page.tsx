import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import {
  getApplicationDetail,
  getSettingsForUser,
  getTemplatesForUser,
} from "@/lib/queries/applications";
import { ApplicationForm } from "@/components/applications/application-form";

export const metadata: Metadata = { title: "Edit application" };
export const dynamic = "force-dynamic";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const [application, settings, templates] = await Promise.all([
    getApplicationDetail(user.id, id),
    getSettingsForUser(user.id),
    getTemplatesForUser(user.id),
  ]);
  if (!application) notFound();

  return (
    <ApplicationForm
      mode="edit"
      initialValues={{
        id: application.id,
        companyName: application.companyName,
        companyWebsite: application.companyWebsite,
        position: application.position,
        location: application.location,
        jobUrl: application.jobUrl,
        contactName: application.contactName,
        contactEmail: application.contactEmail,
        method: application.method,
        status: application.status,
        appliedAt: application.appliedAt,
        nextFollowUpAt: application.nextFollowUpAt,
        notes: application.notes,
      }}
      followUpIntervals={settings?.followUpIntervals ?? [5, 10, 17]}
      templates={templates}
      defaultMethod={settings?.defaultMethod ?? "cold_email"}
      myName={user.name}
      myEmail={user.email}
    />
  );
}
