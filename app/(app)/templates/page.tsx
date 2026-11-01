import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getTemplatesForUser } from "@/lib/queries/applications";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { TemplatesManager } from "@/components/templates/templates-manager";

export const metadata: Metadata = { title: "Templates" };
export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const user = await requireUser();
  const templates = await getTemplatesForUser(user.id);

  return (
    <div className="min-h-full pb-6">
      <PageHeader
        title="Email templates"
        description="Reusable language for cold outreach, follow-ups, and replies."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/emails">
              <Mail className="size-3.5" />
              Email history
            </Link>
          </Button>
        }
      />

      <div className="p-4 lg:p-5">
        <div className="rounded-[11px] border border-line bg-surface-card shadow-card">
          <TemplatesManager
            templates={templates.map((template) => ({
              id: template.id,
              name: template.name,
              kind: template.kind,
              subject: template.subject,
              body: template.body,
              updatedAt: template.updatedAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
