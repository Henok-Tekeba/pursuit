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
    <div className="min-h-dvh bg-surface-canvas p-0 md:p-4 lg:p-6">
      <div className="mx-auto flex h-[100dvh] w-full max-w-[1500px] overflow-hidden border-black/[0.04] bg-surface-main md:h-[calc(100dvh-32px)] md:rounded-[14px] md:border md:shadow-shell lg:h-[calc(100dvh-48px)]">
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
