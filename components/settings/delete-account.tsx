"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAccountAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeleteAccount({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const matches = confirmEmail.trim().toLowerCase() === email.toLowerCase();

  const remove = () => {
    if (!matches) return;
    startTransition(async () => {
      const result = await deleteAccountAction(confirmEmail);
      if (!result.ok) toast.error(result.error);
    });
  };

  return (
    <>
      <section className="rounded-[10px] border border-[#ead9dc] bg-surface-card dark:border-[#3a2529] shadow-card">
        <div className="flex items-center gap-2 border-b border-[#f0e4e6] px-4 py-3 dark:border-[#3a2529]">
          <Trash2 className="size-3.5 text-[#b94a5c]" />
          <div>
            <h2 className="text-[13.5px] font-medium text-[#9f3f4f] dark:text-[#dfa2ac]">Danger zone</h2>
            <p className="mt-0.5 text-[10.5px] text-ink-muted">
              Delete your workspace and all of its data.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="max-w-[420px] text-[10.5px] leading-relaxed text-ink-muted">
            This permanently removes your applications, emails, companies, templates, notes, and
            settings. It cannot be undone. Export your data first if you want a copy.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="border-[#e7cfd4] text-[#a34252] hover:border-[#d9b7bf] hover:bg-[#fdf5f6] dark:border-[#4a3035] dark:text-[#dfa2ac] dark:hover:bg-[#2a1d20]"
          >
            <Trash2 className="size-3.5" />
            Delete account
          </Button>
        </div>
      </section>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setConfirmEmail("");
        }}
      >
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <div className="mb-1 grid size-9 place-items-center rounded-lg bg-[#fff5f6] text-[#b94a5c]">
              <AlertTriangle className="size-4" />
            </div>
            <DialogTitle>Delete this account?</DialogTitle>
            <DialogDescription>
              This removes your entire Pursuit workspace. Your Google account will not be deleted,
              but your applications and account data here will be.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="delete-account-email" className="block text-[11px] font-medium text-ink-secondary">
              Type <span className="text-ink">{email}</span> to confirm
            </label>
            <Input
              id="delete-account-email"
              type="email"
              autoComplete="off"
              value={confirmEmail}
              onChange={(event) => setConfirmEmail(event.target.value)}
              placeholder={email}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={remove}
              disabled={!matches || pending}
              className="bg-[#b94a5c] text-white hover:bg-[#a33f50]"
            >
              {pending && <Loader2 className="size-3.5 animate-spin" />}
              {pending ? "Deleting..." : "Delete everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
