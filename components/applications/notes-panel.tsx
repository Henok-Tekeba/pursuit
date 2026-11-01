"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, NotebookPen, Send } from "lucide-react";
import { toast } from "sonner";
import { addNoteAction } from "@/app/actions/applications";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { formatDateWithTime } from "@/lib/utils";

export type NoteRecord = {
  id: string;
  description: string | null;
  occurredAt: string;
};

export function NotesPanel({
  applicationId,
  applicationNotes,
  notes,
}: {
  applicationId: string;
  applicationNotes: string | null;
  notes: NoteRecord[];
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!note.trim()) return;
    startTransition(async () => {
      const result = await addNoteAction(applicationId, note);
      if (result.ok) {
        toast.success("Note added.");
        setNote("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {applicationNotes && (
        <div className="rounded-lg border border-line bg-surface-subtle/50 p-3">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-faint">
            Application notes
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-secondary">
            {applicationNotes}
          </p>
        </div>
      )}

      <div className="rounded-lg border border-line bg-surface-card p-3">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-surface-subtle text-ink-muted">
            <NotebookPen className="size-3" />
          </span>
          <p className="text-[12.5px] font-medium text-ink">Add a note to the timeline</p>
        </div>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What happened? What should future-you remember?"
          className="mt-2.5 min-h-[88px]"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10.5px] text-ink-faint">Notes stay attached to this application.</p>
          <Button size="xs" onClick={submit} disabled={pending || !note.trim()}>
            {pending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
            {pending ? "Saving…" : "Add note"}
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No notes yet"
          description="Use notes for interview prep, referral details, or anything you want to remember."
          compact
        />
      ) : (
        <div className="space-y-2">
          {notes.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-line px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11.5px] font-medium text-ink">Note</p>
                <p className="text-[10px] text-ink-faint">{formatDateWithTime(entry.occurredAt)}</p>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-secondary">
                {entry.description || "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
