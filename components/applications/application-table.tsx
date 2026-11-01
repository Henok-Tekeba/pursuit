"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ExternalLink,
  FileText,
  Mail,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserRoundX,
} from "lucide-react";
import { toast } from "sonner";
import type { ApplicationListItem } from "@/lib/queries/applications";
import { STATUS_LABELS, STATUS_ORDER, STATUS_STYLES } from "@/lib/constants";
import type { ApplicationStatus } from "@/lib/db/schema";
import { cn, formatDate, getFollowUpLabel, isOverdue } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PersonAvatar } from "@/components/company-avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  bulkDeleteApplicationsAction,
  bulkUpdateStatusAction,
  deleteApplicationAction,
  updateApplicationStatusAction,
} from "@/app/actions/applications";

export function ApplicationTable({
  items,
  pagination,
}: {
  items: ApplicationListItem[];
  pagination: { total: number; page: number; pageSize: number; pageCount: number };
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<ApplicationListItem | null>(null);
  const [ghostTarget, setGhostTarget] = useState<ApplicationListItem | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    setSelected(new Set());
  }, [items]);

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setStatus = (item: ApplicationListItem, status: ApplicationStatus) => {
    if (status === item.status) return;
    startTransition(async () => {
      const result = await updateApplicationStatusAction(item.id, status);
      if (result.ok) {
        toast.success(result.message ?? "Status updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteApplicationAction(deleteTarget.id);
      if (result.ok) {
        toast.success("Application deleted.");
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const confirmGhost = () => {
    if (!ghostTarget) return;
    startTransition(async () => {
      const result = await updateApplicationStatusAction(ghostTarget.id, "ghosted");
      if (result.ok) {
        toast.success("Marked as ghosted. You can undo this any time by changing the status.");
        setGhostTarget(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const bulkDelete = () => {
    startTransition(async () => {
      const result = await bulkDeleteApplicationsAction(Array.from(selected));
      if (result.ok) {
        toast.success(result.message ?? "Applications deleted.");
        setBulkDeleteOpen(false);
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const bulkStatus = (status: ApplicationStatus) => {
    startTransition(async () => {
      const result = await bulkUpdateStatusAction(Array.from(selected), status);
      if (result.ok) {
        toast.success(result.message ?? "Statuses updated.");
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#e4e6f0] bg-[#f7f8fc] px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
          <span className="text-[12px] font-medium text-ink">
            {selected.size} selected
          </span>
          <span className="h-3 w-px bg-line-strong" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xs" disabled={pending}>
                Change status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[300px]">
              {STATUS_ORDER.map((status) => (
                <DropdownMenuItem key={status} onSelect={() => bulkStatus(status)}>
                  <span className={cn("size-1.5 rounded-full", STATUS_STYLES[status].dot)} />
                  {STATUS_LABELS[status]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="dangerGhost"
            size="xs"
            onClick={() => setBulkDeleteOpen(true)}
            disabled={pending}
          >
            <Trash2 className="size-3" />
            Delete
          </Button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-[11.5px] text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="divide-y divide-line min-[1150px]:hidden">
        {items.map((item) => (
          <MobileApplicationCard
            key={item.id}
            item={item}
            selected={selected.has(item.id)}
            onToggle={() => toggleOne(item.id)}
            onChangeStatus={(status) => {
              if (status === "ghosted") setGhostTarget(item);
              else setStatus(item, status);
            }}
            onGhost={() => setGhostTarget(item)}
            onDelete={() => setDeleteTarget(item)}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto min-[1150px]:block">
        <table className="w-full min-w-[740px] border-separate border-spacing-0 text-left">
          <colgroup>
            <col className="w-[38px]" />
            <col className="w-[128px]" />
            <col />
            <col className="w-[132px]" />
            <col className="w-[146px]" />
            <col className="w-[84px]" />
          </colgroup>
          <thead>
            <tr className="bg-[#f8f9fb] dark:bg-white/[0.035]">
              <th className="rounded-l-[7px] py-2 pl-3 pr-1">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all applications"
                />
              </th>
              <TableHead>Application <ChevronsUpDown /></TableHead>
              <TableHead>Company <ChevronsUpDown /></TableHead>
              <TableHead>Applied <ChevronsUpDown /></TableHead>
              <TableHead>Status <ChevronsUpDown /></TableHead>
              <TableHead className="rounded-r-[7px] pr-3 text-right">Actions</TableHead>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="group">
                <td className="border-b border-line py-2 pl-3 pr-1">
                  <Checkbox
                    checked={selected.has(item.id)}
                    onCheckedChange={() => toggleOne(item.id)}
                    aria-label={`Select ${item.companyName}`}
                  />
                </td>
                <td className="border-b border-line py-2 pr-2">
                  <Link
                    href={`/applications/${item.id}`}
                    className="text-[12px] font-medium tracking-[0.01em] text-ink transition-colors hover:text-ink-secondary"
                  >
                    {item.reference}
                  </Link>
                </td>
                <td className="border-b border-line py-2 pr-4">
                  <Link href={`/applications/${item.id}`} className="flex min-w-0 items-center gap-2.5">
                    <PersonAvatar
                      name={item.contactName || item.companyName}
                      src={item.contactAvatarUrl}
                      className="size-6"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-medium leading-tight text-ink">
                          {item.companyName}
                        </span>
                        {item.nextFollowUpAt && isOverdue(item.nextFollowUpAt) && (
                          <span className="shrink-0 rounded-[3px] bg-[#fff1e6] px-1 py-0.5 text-[9.5px] font-medium text-[#c07a2b] dark:bg-[#3b2a1c]">
                            Follow-up
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] leading-tight text-ink-muted">
                        {item.position}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="border-b border-line py-2 pr-3">
                  <span className="block text-[12px] leading-tight text-ink-secondary">
                    {formatDate(item.appliedAt)}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] leading-tight text-ink-faint">
                    {getFollowUpLabel(item.nextFollowUpAt)}
                  </span>
                </td>
                <td className="border-b border-line py-2 pr-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="border-b border-line py-2 pr-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/applications/${item.id}`}
                      className="grid size-8 place-items-center rounded-md border border-line bg-surface-card text-ink-muted shadow-[0_1px_1px_rgba(16,24,40,0.02)] transition-colors hover:border-line-strong hover:text-ink"
                      aria-label={`View ${item.companyName} application`}
                    >
                      <FileText className="size-3.5" strokeWidth={1.7} />
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="grid size-8 place-items-center rounded-md border border-line bg-surface-card text-ink-muted shadow-[0_1px_1px_rgba(16,24,40,0.02)] transition-colors hover:border-line-strong hover:text-ink"
                          aria-label={`Actions for ${item.companyName}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[190px]">
                        <DropdownMenuLabel>{item.reference}</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/applications/${item.id}`}>
                            <ExternalLink />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/applications/${item.id}?action=email`}>
                            <Mail />
                            Log email
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/applications/${item.id}/edit`}>
                            <Pencil />
                            Edit application
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <span className={cn("size-1.5 rounded-full", STATUS_STYLES[item.status].dot)} />
                            Change status
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="max-h-[320px] overflow-y-auto">
                            {STATUS_ORDER.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onSelect={() => {
                                  if (status === "ghosted") setGhostTarget(item);
                                  else setStatus(item, status);
                                }}
                              >
                                <span className={cn("size-1.5 rounded-full", STATUS_STYLES[status].dot)} />
                                {STATUS_LABELS[status]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem onSelect={() => setGhostTarget(item)}>
                          <UserRoundX />
                          Mark as ghosted…
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-[#c24e63] focus:text-[#c24e63]"
                          onSelect={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="!text-[#c24e63]" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={pagination.page}
        pageCount={pagination.pageCount}
        total={pagination.total}
        pageSize={pagination.pageSize}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete this application?</DialogTitle>
            <DialogDescription>
              This permanently removes {deleteTarget?.companyName} ({deleteTarget?.position}), its emails,
              notes, and full timeline. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={pending}>
              {pending ? "Deleting…" : "Delete application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(ghostTarget)} onOpenChange={(open) => !open && setGhostTarget(null)}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Mark as ghosted?</DialogTitle>
            <DialogDescription>
              Ghosted is never applied automatically. Confirming records that {ghostTarget?.companyName} has
              stopped responding after your follow-ups. You can change the status again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setGhostTarget(null)} disabled={pending}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirmGhost} disabled={pending}>
              {pending ? "Updating…" : "Yes, mark as ghosted"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete {selected.size} applications?</DialogTitle>
            <DialogDescription>
              Every email, note, and activity for the selected applications will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkDeleteOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={bulkDelete} disabled={pending}>
              {pending ? "Deleting…" : "Delete applications"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MobileApplicationCard({
  item,
  selected,
  onToggle,
  onChangeStatus,
  onGhost,
  onDelete,
}: {
  item: ApplicationListItem;
  selected: boolean;
  onToggle: () => void;
  onChangeStatus: (status: ApplicationStatus) => void;
  onGhost: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn("py-3", selected && "bg-[#f8f9fc] dark:bg-white/[0.03]")}>
      <div className="flex items-start gap-2.5">
        <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-1.5" aria-label={`Select ${item.companyName}`} />
        <Link href={`/applications/${item.id}`} className="flex min-w-0 flex-1 items-start gap-2.5">
          <PersonAvatar
            name={item.contactName || item.companyName}
            src={item.contactAvatarUrl}
            className="size-8"
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-[13px] font-medium text-ink">{item.companyName}</span>
              <StatusBadge status={item.status} />
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{item.position}</span>
            <span className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[10px] text-ink-faint">
              <span>{item.reference}</span>
              <span>·</span>
              <span>{formatDate(item.appliedAt)}</span>
              {item.nextFollowUpAt && (
                <>
                  <span>·</span>
                  <span className={isOverdue(item.nextFollowUpAt) ? "text-[#c1842c]" : ""}>
                    {getFollowUpLabel(item.nextFollowUpAt)}
                  </span>
                </>
              )}
            </span>
          </span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-surface-card text-ink-muted"
              aria-label={`Actions for ${item.companyName}`}
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[190px]">
            <DropdownMenuLabel>{item.reference}</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/applications/${item.id}`}>
                <ExternalLink />
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/applications/${item.id}?action=email`}>
                <Mail />
                Log email
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/applications/${item.id}/edit`}>
                <Pencil />
                Edit application
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span className={cn("size-1.5 rounded-full", STATUS_STYLES[item.status].dot)} />
                Change status
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-[320px] overflow-y-auto">
                {STATUS_ORDER.map((status) => (
                  <DropdownMenuItem key={status} onSelect={() => onChangeStatus(status)}>
                    <span className={cn("size-1.5 rounded-full", STATUS_STYLES[status].dot)} />
                    {STATUS_LABELS[status]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onSelect={onGhost}>
              <UserRoundX />
              Mark as ghosted…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[#c24e63] focus:text-[#c24e63]" onSelect={onDelete}>
              <Trash2 className="!text-[#c24e63]" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function TableHead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border-b border-line py-2 pr-2 text-[11.5px] font-medium text-ink-muted",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 [&_svg]:size-2.5 [&_svg]:text-ink-faint">
        {children}
      </span>
    </th>
  );
}

function Pagination({
  page,
  pageCount,
  total,
  pageSize,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  };

  const pages = useMemo(() => {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
    const set = new Set<number>([1, pageCount, page - 1, page, page + 1]);
    if (page <= 3) [1, 2, 3, 4].forEach((value) => set.add(value));
    if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((value) => set.add(value));
    return Array.from(set)
      .filter((value) => value >= 1 && value <= pageCount)
      .sort((a, b) => a - b);
  }, [page, pageCount]);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        <PageLink
          href={hrefFor(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
          className="gap-1 px-2"
        >
          <ChevronLeft className="size-3" />
          <span className="hidden sm:inline">Previous</span>
        </PageLink>
        {pages.map((value, index) => {
          const previous = pages[index - 1];
          const showEllipsis = previous !== undefined && value - previous > 1;
          return (
            <span key={value} className="flex items-center gap-1">
              {showEllipsis && <span className="px-0.5 text-[11.5px] text-ink-faint">…</span>}
              <PageLink
                href={hrefFor(value)}
                active={value === page}
                aria-label={`Page ${value}`}
                aria-current={value === page ? "page" : undefined}
              >
                {value}
              </PageLink>
            </span>
          );
        })}
        <PageLink
          href={hrefFor(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          aria-label="Next page"
          className="gap-1 px-2"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-3" />
        </PageLink>
      </div>
      <p className="text-[11.5px] text-ink-muted">
        Showing <span className="font-medium text-ink-secondary">{from}–{to}</span> of{" "}
        <span className="font-medium text-ink-secondary">{total}</span> entries
      </p>
    </div>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
  className,
  ...props
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "children" | "className">) {
  if (disabled) {
    return (
      <span
        className={cn(
          "inline-flex h-8 min-w-8 cursor-not-allowed items-center justify-center rounded-md border border-line bg-surface-card px-1.5 text-[11.5px] text-ink-faint opacity-45",
          className,
        )}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-1.5 text-[11.5px] transition-colors",
        active
          ? "border-transparent bg-[#171b2e] font-medium text-white shadow-sm dark:bg-white dark:text-[#17181b]"
          : "border-line bg-surface-card text-ink-secondary hover:border-line-strong hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
