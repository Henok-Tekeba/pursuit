import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getCompaniesForUser } from "@/lib/queries/applications";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { CompaniesGrid } from "@/components/companies/companies-grid";

export const metadata: Metadata = { title: "Companies" };
export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const user = await requireUser();
  const companies = await getCompaniesForUser(user.id);
  const totalApplications = companies.reduce((sum, company) => sum + company.applicationCount, 0);
  const totalResponses = companies.reduce((sum, company) => sum + company.responseCount, 0);

  return (
    <div className="min-h-full pb-6">
      <PageHeader
        title="Companies"
        description={
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="size-2.5 text-[#5b8def]" />
            {companies.length} companies
            <span className="text-ink-faint">·</span>
            {totalApplications} applications
            <span className="text-ink-faint">·</span>
            {totalResponses} responses
          </span>
        }
        actions={
          <Button asChild size="sm">
            <Link href="/applications/new">
              <Plus className="size-3.5" />
              New application
            </Link>
          </Button>
        }
      />
      <div className="p-4 lg:p-5">
        <div className="rounded-[11px] border border-line bg-surface-card shadow-card">
          <CompaniesGrid
            companies={companies.map((company) => ({
              ...company,
              latestApplication: company.latestApplication,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
