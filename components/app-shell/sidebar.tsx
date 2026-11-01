"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlarmClock,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  ChevronsUpDown,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mail,
  PanelLeftClose,
  Settings,
  User,
  Download,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo";
import { PersonAvatar } from "@/components/company-avatar";
import { signOutAction } from "@/app/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "./theme-toggle";
import type { ShellData, ShellUser } from "./types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Bell;
  badgeKey?: "notifications" | "emails";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/notifications", label: "Notifications", icon: Bell, badgeKey: "notifications" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/follow-ups", label: "Follow-ups", icon: AlarmClock },
  { href: "/emails", label: "Emails", icon: Mail, badgeKey: "emails" },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar({
  user,
  data,
  collapsed = false,
  onToggleCollapse,
  onOpenSearch,
  onOpenHelp,
  onNavigate,
  onClose,
  className,
}: {
  user: ShellUser;
  data: ShellData;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenSearch: () => void;
  onOpenHelp: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-line bg-surface-sidebar transition-[width] duration-200",
        collapsed ? "w-[80px]" : "w-[248px]",
        className,
      )}
    >
      <div className="flex flex-col px-4 pb-2 pt-6">
        <div
          className={cn(
            "flex h-[50px] items-center rounded-[10px] border border-line bg-surface-card shadow-[0_1px_2px_rgba(16,24,40,0.025)]",
            collapsed ? "justify-center px-1.5" : "gap-3 px-2.5",
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="flex size-9 items-center justify-center rounded-[8px] bg-[#111114] text-white transition-opacity hover:opacity-85"
                  aria-label="Expand sidebar"
                >
                  <LogoMark className="size-[19px] text-white" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[8px] bg-[#111114] text-white">
                <LogoMark className="size-[19px] text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11.5px] font-medium leading-tight text-ink">
                  Internship Tracker
                </p>
                <p className="mt-0.5 truncate text-[10px] leading-tight text-ink-muted">
                  {data.totalApplications === 0
                    ? "Your personal CRM"
                    : `${data.totalApplications} application${data.totalApplications === 1 ? "" : "s"} tracked`}
                </p>
              </div>
              {onToggleCollapse ? (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="ml-auto grid size-6 shrink-0 place-items-center rounded-md text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink-secondary"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="size-3.5" strokeWidth={1.8} />
                </button>
              ) : onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-auto grid size-6 shrink-0 place-items-center rounded-md text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink-secondary"
                  aria-label="Close navigation"
                >
                  <X className="size-3.5" strokeWidth={1.8} />
                </button>
              ) : null}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenSearch}
          className={cn(
            "mt-3.5 flex h-9 items-center rounded-lg border border-line bg-surface-card text-ink-muted shadow-[0_1px_1px_rgba(16,24,40,0.02)] transition-colors hover:border-line-strong",
            collapsed ? "justify-center px-0" : "gap-2 px-2.5",
          )}
          aria-label="Search anything"
        >
          <SearchIcon className="size-3.5 shrink-0" />
          {!collapsed && (
            <>
              <span className="text-[12px]">Search anything</span>
              <span className="ml-auto flex items-center gap-0.5 rounded-[4px] border border-line bg-surface-subtle px-1 py-[2px] text-[9.5px] font-medium text-ink-faint">
                <span>⌘</span>K
              </span>
            </>
          )}
        </button>
      </div>

      <div className={cn("px-4", collapsed && "px-2")}>
        {!collapsed && (
          <p className="mb-2 mt-4 pl-1 text-[10px] font-medium uppercase tracking-[0.13em] text-ink-faint">
            Menu
          </p>
        )}
        <nav className={cn("space-y-1", collapsed && "mt-4")}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            const badge =
              item.badgeKey === "notifications"
                ? data.notificationCount
                : item.badgeKey === "emails"
                  ? data.inboundRecent
                  : 0;
            const content = (
              <>
                <Icon
                  className={cn("size-4 shrink-0", active ? "text-ink" : "text-ink-muted")}
                  strokeWidth={1.7}
                />
                {!collapsed && <span className="truncate text-[12.5px] leading-none">{item.label}</span>}
                {!collapsed && badge > 0 && (
                  <span className="ml-auto flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#fe4a6d] px-1 text-[9.5px] font-medium text-white">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
                {collapsed && badge > 0 && (
                  <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#fe4a6d]" />
                )}
              </>
            );

            const link = (
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-[38px] items-center rounded-lg transition-colors",
                  collapsed ? "justify-center px-0" : "gap-3 px-2.5",
                  active
                    ? "border border-line bg-surface-card text-ink shadow-[0_1px_2px_rgba(16,24,40,0.035)]"
                    : "border border-transparent text-ink-secondary hover:bg-black/[0.025] hover:text-ink dark:hover:bg-white/[0.04]",
                )}
              >
                {content}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                    {badge > 0 ? ` · ${badge}` : ""}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return <div key={item.href}>{link}</div>;
          })}
        </nav>
      </div>

      <div className={cn("mt-auto space-y-0.5 px-4 pb-3 pt-6", collapsed && "px-2")}>
        <div
          className={cn(
            "flex h-8 items-center text-[12px] text-ink-secondary",
            collapsed ? "justify-center" : "justify-between px-1",
          )}
        >
          {!collapsed && (
            <span className="flex items-center gap-2.5">
              <MoonIcon className="size-[14px] text-ink-muted" />
              Dark Mode
            </span>
          )}
          <ThemeToggle />
        </div>
        <button
          type="button"
          onClick={onOpenHelp}
          className={cn(
            "flex h-8 w-full items-center rounded-md text-[12px] text-ink-secondary transition-colors hover:bg-black/[0.025] hover:text-ink dark:hover:bg-white/[0.04]",
            collapsed ? "justify-center" : "gap-2.5 px-1",
          )}
        >
          <HelpCircle className="size-4 text-ink-muted" strokeWidth={1.7} />
          {!collapsed && "Help Center"}
        </button>
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            "flex h-8 items-center rounded-md text-[12px] transition-colors",
            pathname === "/settings"
              ? "bg-surface-card text-ink shadow-[0_1px_2px_rgba(16,24,40,0.03)]"
              : "text-ink-secondary hover:bg-black/[0.025] hover:text-ink dark:hover:bg-white/[0.04]",
            collapsed ? "justify-center" : "gap-2.5 px-1",
          )}
        >
          <Settings className="size-4 text-ink-muted" strokeWidth={1.7} />
          {!collapsed && "Setting"}
        </Link>

        <div className="pt-3">
          <UserMenu user={user} collapsed={collapsed} onNavigate={onNavigate} />
        </div>
      </div>
    </aside>
  );
}

function UserMenu({
  user,
  collapsed,
  onNavigate,
}: {
  user: ShellUser;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex w-full items-center rounded-lg border border-line bg-surface-card shadow-[0_1px_2px_rgba(16,24,40,0.025)] transition-colors hover:border-line-strong",
            collapsed ? "justify-center px-1 py-2" : "gap-2.5 px-2.5 py-2.5",
          )}
          aria-label="Open account menu"
        >
          <PersonAvatar name={user.name} src={user.avatarUrl} className="size-8" />
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[11.5px] font-medium leading-tight text-ink">{user.name}</p>
                <p className="mt-0.5 truncate text-[10px] leading-tight text-ink-muted">{user.email}</p>
              </div>
              <ChevronsUpDown className="size-3 text-ink-faint" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-[214px]">
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <div className="mb-1 flex items-center gap-2 px-2 pb-2">
          <PersonAvatar name={user.name} src={user.avatarUrl} className="size-8" />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-medium text-ink">{user.name}</p>
            <p className="truncate text-[11px] text-ink-muted">{user.email}</p>
          </div>
          {user.isDemo && (
            <span className="ml-auto rounded-[4px] border border-line bg-surface-subtle px-1 py-0.5 text-[9.5px] text-ink-muted">
              Demo
            </span>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" onClick={onNavigate}>
            <User />
            Profile & settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/api/export">
            <Download />
            Export applications
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <button
            type="submit"
            className="relative flex w-full cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[#b94a5c] outline-none transition-colors hover:bg-[#fdf1f3] focus:bg-[#fdf1f3] dark:hover:bg-[#332427] dark:focus:bg-[#332427]"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
