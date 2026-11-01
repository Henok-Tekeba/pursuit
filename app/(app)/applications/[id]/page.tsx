import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getApplicationDetail, getTemplatesForUser } from "@/lib/queries/applications";
import { ApplicationDetail } from "@/components/applications/application-detail";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const application = await getApplicationDetail(user.id, id);
  if (!application) return { title: "Application" };
  return { title: `${application.companyName} — ${application.position}` };
}

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const [{ id }, { action }] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const [application, templates] = await Promise.all([
    getApplicationDetail(user.id, id),
    getTemplatesForUser(user.id),
  ]);
  if (!application) notFound();

  return (
    <ApplicationDetail
      application={{
        id: application.id,
        reference: application.reference,
        companyName: application.companyName,
        companyWebsite: application.companyWebsite,
        position: application.position,
        location: application.location,
        jobUrl: application.jobUrl,
        contactName: application.contactName,
        contactEmail: application.contactEmail,
        contactAvatarUrl: application.contactAvatarUrl,
        method: application.method,
        status: application.status,
        appliedAt: application.appliedAt,
        lastContactAt: application.lastContactAt,
        nextFollowUpAt: application.nextFollowUpAt,
        firstResponseAt: application.firstResponseAt,
        notes: application.notes,
        companyNotes: application.companyNotes,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
      }}
      emails={application.emails.map((email) => ({
        id: email.id,
        direction: email.direction,
        kind: email.kind,
        subject: email.subject,
        body: email.body,
        fromEmail: email.fromEmail,
        toEmail: email.toEmail,
        occurredAt: email.occurredAt,
      }))}
      timeline={application.timeline.map((entry) => ({
        id: entry.id,
        type: entry.type,
        title: entry.title,
        description: entry.description,
        occurredAt: entry.occurredAt,
      }))}
      templates={templates}
      user={{ name: user.name, email: user.email }}
      followUpIntervals={application.settings?.followUpIntervals ?? [5, 10, 17]}
      initialAction={action}
    />
  );
}
