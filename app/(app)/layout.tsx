import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/session";
import { getShellData } from "@/lib/queries/applications";
import { AppShell } from "@/components/app-shell/app-shell";
import type { DueFollowUp } from "@/components/app-shell/types";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.onboardedAt && !user.isDemo) redirect("/onboarding");
  const shellData = await getShellData(user.id);

  const dueFollowUps: DueFollowUp[] = shellData.dueFollowUps.slice(0, 8).map((item) => ({
    id: item.id,
    companyName: item.companyName,
    position: item.position,
    nextFollowUpAt: item.nextFollowUpAt ?? shellData.today,
  }));

  return (
    <AppShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isDemo: user.isDemo,
        isAdmin: isAdminEmail(user.email),
      }}
      data={{
        totalApplications: shellData.totalApplications,
        dueCount: shellData.dueCount,
        inboundRecent: shellData.inboundRecent,
        interviewCount: shellData.interviewCount,
        notificationCount: shellData.notificationCount,
        dueFollowUps,
      }}
    >
      {children}
    </AppShell>
  );
}
