"use client";

import Link from "next/link";
import {
  ChevronDown,
  Download,
  FileDown,
  FilePlus2,
  Menu,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsPopover } from "./notifications";
import type { DueFollowUp, ShellUser } from "./types";

export function Topbar({
  user,
  dueFollowUps,
  notificationCount,
  onOpenMenu,
  onOpenSearch,
}: {
  user: ShellUser;
  dueFollowUps: DueFollowUp[];
  notificationCount: number;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface-main px-4 md:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMenu}
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface-card text-ink-secondary lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-3.5" />
        </button>
        <div className="min-w-0">
          <p className="text-[10.5px] leading-tight text-ink-muted">Welcome,</p>
          <p className="truncate text-[13px] font-medium leading-tight tracking-[-0.01em] text-ink">
            {user.name}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden h-9 w-[260px] items-center gap-2 rounded-lg border border-line bg-surface-card px-3 text-left text-[12px] text-ink-muted shadow-[0_1px_1px_rgba(16,24,40,0.02)] transition-colors hover:border-line-strong sm:flex"
        >
          <Search className="size-4 text-ink-muted" />
          <span className="truncate">Find something</span>
          <span className="ml-auto flex items-center gap-0.5 rounded-[4px] border border-line bg-surface-subtle px-1 py-[2px] text-[9.5px] font-medium text-ink-faint">
            <span>⌘</span>K
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenSearch}
          className="grid size-9 place-items-center rounded-lg border border-line bg-surface-card text-ink-secondary sm:hidden"
          aria-label="Search"
        >
          <Search className="size-3.5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hidden h-9 items-center gap-1.5 rounded-lg border border-line bg-surface-card px-3 text-[12px] font-medium text-ink-secondary shadow-[0_1px_1px_rgba(16,24,40,0.02)] transition-colors hover:border-line-strong hover:text-ink sm:flex"
            >
              <SlidersHorizontal className="size-4" strokeWidth={1.7} />
              Manage
              <ChevronDown className="size-2.5 text-ink-faint" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[198px]">
            <DropdownMenuLabel>Manage</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/applications/new">
                <Plus />
                New application
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/templates">
                <FilePlus2 />
                New email template
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/follow-ups">
                <UserRound />
                Review follow-ups
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/api/export">
                <FileDown />
                Export applications
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings />
                Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationsPopover dueFollowUps={dueFollowUps} notificationCount={notificationCount} />

        <Button asChild size="sm" variant="outline" className="hidden gap-1.5 md:inline-flex">
          <a href="/api/export">
            <Download className="size-3.5" strokeWidth={1.8} />
            Export
          </a>
        </Button>
      </div>
    </header>
  );
}
