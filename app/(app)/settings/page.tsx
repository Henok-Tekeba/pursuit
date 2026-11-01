import type { Metadata } from "next";
import { Download, KeyRound, LogOut, Palette, ShieldCheck, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getSettingsForUser } from "@/lib/queries/applications";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ProfileSettings, FollowUpSettings, PasswordSettings } from "@/components/settings/settings-forms";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await getSettingsForUser(user.id);

  return (
    <div className="min-h-full pb-6">
      <PageHeader
        title="Settings"
        description="Your profile, follow-up cadence, and workspace preferences."
        actions={
          <Button asChild variant="outline" size="sm">
            <a href="/api/export">
              <Download className="size-3.5" />
              Export data
            </a>
          </Button>
        }
      />

      <div className="grid gap-4 p-4 min-[1150px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <UserRound className="size-3.5 text-ink-muted" />
              <div>
                <h2 className="text-[13.5px] font-medium text-ink">Profile</h2>
                <p className="mt-0.5 text-[10.5px] text-ink-muted">How you appear inside your workspace.</p>
              </div>
            </div>
            <ProfileSettings
              user={{
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                targetRole: user.targetRole,
                university: user.university,
                graduationYear: user.graduationYear,
                location: user.location,
                isDemo: user.isDemo,
              }}
            />
          </section>

          <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <Palette className="size-3.5 text-ink-muted" />
              <div>
                <h2 className="text-[13.5px] font-medium text-ink">Appearance</h2>
                <p className="mt-0.5 text-[10.5px] text-ink-muted">A calm light theme, or a darker workspace.</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-[12px] font-medium text-ink">Dark mode</p>
                <p className="mt-0.5 text-[10.5px] text-ink-muted">
                  Your choice is remembered on this device.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </section>

          <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <KeyRound className="size-3.5 text-ink-muted" />
              <div>
                <h2 className="text-[14.5px] font-medium text-ink">Password</h2>
                <p className="mt-0.5 text-[11px] text-ink-muted">Keep your account secure.</p>
              </div>
            </div>
            <PasswordSettings hasPassword={Boolean(user.passwordHash)} />
          </section>

          <section className="rounded-[10px] border border-line bg-surface-card shadow-card">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <ShieldCheck className="size-3.5 text-ink-muted" />
              <div>
                <h2 className="text-[13.5px] font-medium text-ink">Account</h2>
                <p className="mt-0.5 text-[10.5px] text-ink-muted">Your data stays private to this account.</p>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div className="rounded-lg border border-line bg-surface-subtle/50 p-3 text-[10.5px] leading-relaxed text-ink-muted">
                <p className="font-medium text-ink-secondary">Authentication</p>
                <p className="mt-1">
                  {user.isDemo
                    ? "You're in the demo workspace. Sign out to create your own private workspace with email."
                    : "Your email is verified through Google and your applications are scoped to this account."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11.5px] font-medium text-ink">{user.name}</p>
                  <p className="mt-0.5 text-[10.5px] text-ink-muted">{user.email}</p>
                </div>
                <form action="/api/auth/signout" method="post">
                  <Button type="submit" variant="outline" size="sm">
                    <LogOut className="size-3.5" />
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
          </section>
        </div>

        <section className="h-fit rounded-[10px] border border-line bg-surface-card shadow-card">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-[13.5px] font-medium text-ink">Follow-up cadence</h2>
            <p className="mt-0.5 text-[10.5px] text-ink-muted">
              Defaults are suggestions — make them work for your outreach.
            </p>
          </div>
          <FollowUpSettings
            initialIntervals={settings?.followUpIntervals ?? [5, 10, 17]}
            defaultMethod={settings?.defaultMethod ?? "cold_email"}
            emailSignature={settings?.emailSignature ?? null}
          />
          <div className="border-t border-line px-4 py-3 text-[10.5px] leading-relaxed text-ink-faint">
            Changing your cadence affects new applications and future suggestions. Existing follow-up dates are
            left untouched unless you reschedule them.
          </div>
        </section>
      </div>
    </div>
  );
}
