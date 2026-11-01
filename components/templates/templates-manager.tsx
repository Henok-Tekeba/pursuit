"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { TemplateKind } from "@/lib/db/schema";
import { TEMPLATE_KIND_LABELS, TEMPLATE_VARIABLES } from "@/lib/constants";
import {
  createTemplateAction,
  deleteTemplateAction,
  updateTemplateAction,
} from "@/app/actions/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { cn, formatDate } from "@/lib/utils";

export type TemplateView = {
  id: string;
  name: string;
  kind: TemplateKind;
  subject: string;
  body: string;
  updatedAt: string;
};

const FILTERS: Array<{ value: "all" | TemplateKind; label: string }> = [
  { value: "all", label: "All templates" },
  { value: "cold_email", label: "Cold email" },
  { value: "follow_up", label: "Follow-up" },
  { value: "reply", label: "Reply" },
  { value: "other", label: "Other" },
];

type EditorState = {
  open: boolean;
  mode: "create" | "edit";
  id?: string;
  name: string;
  kind: TemplateKind;
  subject: string;
  body: string;
};

const emptyEditor: EditorState = {
  open: false,
  mode: "create",
  name: "",
  kind: "cold_email",
  subject: "",
  body: "",
};

export function TemplatesManager({ templates }: { templates: TemplateView[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | TemplateKind>("all");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [deleteTarget, setDeleteTarget] = useState<TemplateView | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return templates.filter((template) => {
      if (filter !== "all" && template.kind !== filter) return false;
      if (!search) return true;
      return (
        template.name.toLowerCase().includes(search) ||
        template.subject.toLowerCase().includes(search) ||
        template.body.toLowerCase().includes(search)
      );
    });
  }, [templates, filter, query]);

  const counts = useMemo(
    () =>
      templates.reduce(
        (map, template) => {
          map[template.kind] = (map[template.kind] ?? 0) + 1;
          return map;
        },
        {} as Record<string, number>,
      ),
    [templates],
  );

  const openCreate = () => setEditor({ ...emptyEditor, open: true });

  const openEdit = (template: TemplateView) =>
    setEditor({
      open: true,
      mode: "edit",
      id: template.id,
      name: template.name,
      kind: template.kind,
      subject: template.subject,
      body: template.body,
    });

  const duplicate = (template: TemplateView) =>
    setEditor({
      open: true,
      mode: "create",
      name: `${template.name} (copy)`,
      kind: template.kind,
      subject: template.subject,
      body: template.body,
    });

  const save = () => {
    if (!editor.name.trim() || !editor.subject.trim() || !editor.body.trim()) {
      toast.error("Add a name, subject, and message body first.");
      return;
    }
    startTransition(async () => {
      const payload = {
        name: editor.name,
        kind: editor.kind,
        subject: editor.subject,
        body: editor.body,
      };
      const result =
        editor.mode === "create"
          ? await createTemplateAction(payload)
          : await updateTemplateAction({ ...payload, id: editor.id! });
      if (result.ok) {
        toast.success(result.message ?? "Template saved.");
        setEditor(emptyEditor);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const remove = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteTemplateAction(deleteTarget.id);
      if (result.ok) {
        toast.success("Template deleted.");
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                "flex h-7 items-center rounded-md px-2.5 text-[12px] font-medium transition-colors",
                filter === item.value
                  ? "bg-ink text-surface-card shadow-sm"
                  : "text-ink-muted hover:bg-surface-hover hover:text-ink",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "ml-1.5 text-[10px]",
                  filter === item.value ? "text-surface-card/65" : "text-ink-faint",
                )}
              >
                {item.value === "all" ? templates.length : counts[item.value] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates…"
              className="h-8 w-[190px] rounded-lg border border-line bg-surface-card pl-8 pr-2.5 text-[12px] text-ink outline-none placeholder:text-ink-faint focus:border-[#cfcfd4]"
            />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            New template
          </Button>
        </div>
      </div>

      <div className="p-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={templates.length === 0 ? "No templates yet" : "No templates match"}
            description={
              templates.length === 0
                ? "Save your best cold email and follow-up language once, then reuse it without starting from a blank page."
                : "Try another search or choose a different type."
            }
            action={
              templates.length === 0 ? (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="size-3.5" />
                  Create first template
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => { setQuery(""); setFilter("all"); }}>
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 min-[1150px]:grid-cols-3">
            {filtered.map((template) => (
              <article
                key={template.id}
                className="group flex flex-col rounded-[10px] border border-line bg-surface-card transition-shadow hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-2 border-b border-line px-3.5 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded-[3px] border px-1 py-0.5 text-[9.5px] font-medium",
                          template.kind === "cold_email"
                            ? "border-[#dcecf7] bg-[#f2f9fd] text-[#357ba9]"
                            : template.kind === "follow_up"
                              ? "border-[#f5ead5] bg-[#fffaf1] text-[#c1842c]"
                              : "border-line bg-surface-subtle text-ink-secondary",
                        )}
                      >
                        {TEMPLATE_KIND_LABELS[template.kind]}
                      </span>
                      <span className="text-[10px] text-ink-faint">
                        Updated {formatDate(template.updatedAt)}
                      </span>
                    </div>
                    <h3 className="mt-1.5 truncate text-[13px] font-medium text-ink">{template.name}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="grid size-6 shrink-0 place-items-center rounded-md text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
                        aria-label="Template actions"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[168px]">
                      <DropdownMenuItem onSelect={() => openEdit(template)}>
                        <Pencil />
                        Edit template
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => duplicate(template)}>
                        <Copy />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-[#c24e63] focus:text-[#c24e63]"
                        onSelect={() => setDeleteTarget(template)}
                      >
                        <Trash2 className="!text-[#c24e63]" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(template)}
                  className="flex-1 px-3.5 py-3 text-left"
                >
                  <p className="line-clamp-2 text-[11.5px] font-medium leading-relaxed text-ink-secondary">
                    {template.subject}
                  </p>
                  <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-[11px] leading-relaxed text-ink-muted">
                    {template.body}
                  </p>
                </button>
                <div className="flex items-center justify-between border-t border-line px-3.5 py-2">
                  <span className="text-[10px] text-ink-faint">
                    {TEMPLATE_VARIABLES.filter((variable) => template.body.includes(variable)).length} placeholders
                  </span>
                  <Button variant="ghost" size="xs" onClick={() => openEdit(template)}>
                    <Pencil className="size-3" />
                    Edit
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[10.5px] text-ink-faint">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3" />
          Placeholders are filled in automatically when you use a template.
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {TEMPLATE_VARIABLES.map((variable) => (
            <span
              key={variable}
              className="rounded-[3px] border border-line bg-surface-subtle px-1 py-0.5 font-mono text-[9.5px] text-ink-secondary"
            >
              {variable}
            </span>
          ))}
        </div>
      </div>

      <Dialog open={editor.open} onOpenChange={(open) => setEditor((current) => ({ ...current, open }))}>
        <DialogContent className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editor.mode === "create" ? "New template" : "Edit template"}</DialogTitle>
            <DialogDescription>
              Write once, reuse everywhere. Placeholders are replaced with each application&apos;s details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="template-name">Template name</Label>
                <Input
                  id="template-name"
                  value={editor.name}
                  onChange={(event) => setEditor((current) => ({ ...current, name: event.target.value }))}
                  placeholder="e.g. Product design cold outreach"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={editor.kind}
                  onValueChange={(value) =>
                    setEditor((current) => ({ ...current, kind: value as TemplateKind }))
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATE_KIND_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template-subject">Subject line</Label>
              <Input
                id="template-subject"
                value={editor.subject}
                onChange={(event) => setEditor((current) => ({ ...current, subject: event.target.value }))}
                placeholder="Quick question about the {{position}} role"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="template-body">Message body</Label>
                <span className="text-[10px] text-ink-faint">{editor.body.length} characters</span>
              </div>
              <Textarea
                id="template-body"
                value={editor.body}
                onChange={(event) => setEditor((current) => ({ ...current, body: event.target.value }))}
                className="min-h-[200px] font-sans"
                placeholder={"Hi {{contactName}},\n\nI'm reaching out about {{position}} at {{company}}…"}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() =>
                    setEditor((current) => ({ ...current, body: `${current.body}${variable}` }))
                  }
                  className="rounded-[3px] border border-line bg-surface-subtle px-1.5 py-1 font-mono text-[10px] text-ink-secondary transition-colors hover:border-line-strong hover:text-ink"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditor(emptyEditor)} disabled={pending}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={pending}>
              {pending && <Loader2 className="size-3 animate-spin" />}
              {pending ? "Saving…" : editor.mode === "create" ? "Create template" : "Save template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
            <DialogDescription>
              “{deleteTarget?.name}” will be removed. Emails already logged from this template are not
              affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={remove} disabled={pending}>
              {pending ? "Deleting…" : "Delete template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
