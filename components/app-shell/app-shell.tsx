"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { SearchDialog } from "./search-dialog";
import { HelpCenterDialog } from "./help-dialog";
import { ProductTour } from "@/components/onboarding/product-tour";
import type { ShellData, ShellUser } from "./types";
import { cn } from "@/lib/utils";

export function AppShell({
  user,
  data,
  children,
}: {
  user: ShellUser;
  data: ShellData;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("it_sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      window.localStorage.setItem("it_sidebar_collapsed", String(!current));
      return !current;
    });
  };

  useEffect(() => {
    let lastKey = "";
    let lastKeyTime = 0;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      const now = Date.now();
      if (key === "g") {
        lastKey = "g";
        lastKeyTime = now;
        return;
      }
      if (lastKey === "g" && now - lastKeyTime < 900) {
        if (key === "d") router.push("/dashboard");
        if (key === "a") router.push("/applications");
        if (key === "f") router.push("/follow-ups");
      }
      lastKey = "";
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div className="h-dvh w-full overflow-hidden bg-surface-main">
      <div className="flex h-full w-full overflow-hidden bg-surface-main">
        <Sidebar
          user={user}
          data={data}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenHelp={() => setHelpOpen(true)}
          className="hidden lg:flex"
        />

        <div className="flex min-w-0 flex-1 flex-col bg-surface-main">
          <Topbar
            user={user}
            dueFollowUps={data.dueFollowUps}
            notificationCount={data.notificationCount}
            onOpenMenu={() => setMobileOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
          />
          {user.isDemo && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-[#f8f2e8] px-4 py-2 text-[11px] text-ink-muted dark:bg-white/[0.025]">
              <span>
                <span className="font-medium text-ink-secondary">Demo workspace</span> · read-only,
                with sample data only.
              </span>
              <form action="/api/auth/signout?next=/signup" method="post">
                <button
                  type="submit"
                  className="font-medium text-ink underline underline-offset-2 transition-opacity hover:opacity-70"
                >
                  Create your own
                </button>
              </form>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className={cn("min-h-full")}>{children}</div>
          </div>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" hideClose className="w-[264px] border-line p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar
            user={user}
            data={data}
            onOpenSearch={() => {
              setMobileOpen(false);
              setSearchOpen(true);
            }}
            onOpenHelp={() => {
              setMobileOpen(false);
              setHelpOpen(true);
            }}
            onNavigate={() => setMobileOpen(false)}
            onClose={() => setMobileOpen(false)}
            className="w-full border-r-0"
          />
        </SheetContent>
      </Sheet>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <HelpCenterDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <ProductTour />
    </div>
  );
}
