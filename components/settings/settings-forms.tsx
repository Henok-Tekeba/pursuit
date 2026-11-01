"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { ApplicationMethod } from "@/lib/db/schema";
import { METHOD_LABELS, METHOD_ORDER } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PersonAvatar } from "@/components/company-avatar";
import { changePasswordAction, updateProfileAction, type PasswordChangeState } from "@/app/actions/auth";
import { updateSettingsAction } from "@/app/actions/applications";

export function ProfileSettings({
  user,
}: {
  user: { name: string; email: string; avatarUrl: string | null; isDemo: boolean };
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [pending, startTransition] = useTransition();

  const save = () => {
    if (name.trim().length < 2) {
      toast.error("Enter your full name.");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("avatarUrl", avatarUrl);
      const result = await updateProfileAction(formData);
      if (result.ok) {
        toast.success("Profile updated.");
        router.refresh();
      } else {
        toast.error(result.message ?? "Could not update profile.");
      }
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <PersonAvatar name={name} src={avatarUrl || user.avatarUrl} className="size-12" />
        <div>
          <p className="text-[13.5px] font-medium text-ink">{name || "Your name"}</p>
          <p className="mt-0.5 text-[11px] text-ink-muted">{user.email}</p>
          {user.isDemo && (
            <span className="mt-1 inline-flex rounded-[3px] border border-line bg-surface-subtle px-1.5 py-0.5 text-[9.5px] text-ink-muted">
              Demo workspace
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">Full name</Label>
          <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={user.email} readOnly disabled className="text-[12px] opacity-70" />
          <p className="text-[10px] text-ink-faint">Your sign-in email cannot be changed here.</p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="profile-avatar">Avatar URL</Label>
          <Input
            id="profile-avatar"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://… or /avatars/photo.jpg"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending && <Loader2 className="size-3 animate-spin" />}
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </div>
  );
}

export function PasswordSettings({ hasPassword }: { hasPassword: boolean }) {
  const initialState: PasswordChangeState = { status: "idle" };
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="p-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-subtle/50 px-3 py-2.5 text-[10.5px] leading-relaxed text-ink-muted">
        <KeyRound className="mt-0.5 size-3.5 shrink-0 text-ink-faint" />
        <p>
          {hasPassword
            ? "Use a strong password you don't reuse anywhere else."
            : "This account currently signs in with a social provider. Set a password to also sign in with your email."}
        </p>
      </div>
      <div className="mt-3 space-y-3">
        {hasPassword && (
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your current password"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={200}
            placeholder="At least 8 characters"
          />
        </div>
        {state.status === "error" && (
          <p className="text-[10.5px] leading-relaxed text-[#b64c5e]">{state.message}</p>
        )}
        {state.status === "success" && (
          <p className="text-[10.5px] leading-relaxed text-[#2e8a61]">{state.message}</p>
        )}
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={pending}>
            {pending && <Loader2 className="size-3 animate-spin" />}
            {pending ? "Updating…" : "Update password"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function FollowUpSettings({
  initialIntervals,
  defaultMethod,
  emailSignature,
}: {
  initialIntervals: number[];
  defaultMethod: ApplicationMethod;
  emailSignature: string | null;
}) {
  const router = useRouter();
  const [intervals, setIntervals] = useState<number[]>(initialIntervals);
  const [method, setMethod] = useState<ApplicationMethod>(defaultMethod);
  const [signature, setSignature] = useState(emailSignature ?? "");
  const [newInterval, setNewInterval] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setIntervals(initialIntervals);
  }, [initialIntervals]);

  const addInterval = () => {
    const value = Number.parseInt(newInterval, 10);
    if (!Number.isFinite(value) || value < 1 || value > 365) {
      toast.error("Choose a day between 1 and 365.");
      return;
    }
    if (intervals.includes(value)) {
      toast.error("That interval is already included.");
      return;
    }
    if (intervals.length >= 8) {
      toast.error("You can add up to 8 intervals.");
      return;
    }
    setIntervals([...intervals, value].sort((a, b) => a - b));
    setNewInterval("");
  };

  const save = () => {
    if (intervals.length === 0) {
      toast.error("Add at least one follow-up interval.");
      return;
    }
    startTransition(async () => {
      const result = await updateSettingsAction({
        followUpIntervals: intervals,
        defaultMethod: method,
        emailSignature: signature,
      });
      if (result.ok) {
        toast.success("Settings saved. New applications will use this cadence.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="p-4">
      <div>
        <Label>Follow-up intervals</Label>
        <p className="mt-1 text-[10.5px] leading-relaxed text-ink-muted">
          Days after applying. We use these to suggest the next follow-up date and build the cadence preview.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {intervals.map((interval) => (
            <span
              key={interval}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-line bg-surface-subtle px-2 text-[11.5px] text-ink-secondary"
            >
              Day {interval}
              <button
                type="button"
                onClick={() => setIntervals(intervals.filter((value) => value !== interval))}
                className="grid size-3.5 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
                aria-label={`Remove day ${interval}`}
              >
                <X className="size-2.5" />
              </button>
            </span>
          ))}
          <div className="flex h-7 items-center overflow-hidden rounded-lg border border-dashed border-line bg-surface-card">
            <input
              value={newInterval}
              onChange={(event) => setNewInterval(event.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addInterval();
                }
              }}
              placeholder="Add day"
              className="h-full w-[58px] bg-transparent px-2 text-[11.5px] text-ink outline-none placeholder:text-ink-faint"
            />
            <button
              type="button"
              onClick={addInterval}
              className="grid h-full w-6 place-items-center border-l border-line text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
              aria-label="Add interval"
            >
              <Plus className="size-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Default application method</Label>
          <Select value={method} onValueChange={(value) => setMethod(value as ApplicationMethod)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHOD_ORDER.map((value) => (
                <SelectItem key={value} value={value}>
                  {METHOD_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg border border-line bg-surface-subtle/50 p-2.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint">Preview</p>
          <div className="mt-1.5 flex items-center gap-1">
            {intervals.map((interval, index) => (
              <span key={interval} className="flex items-center gap-1">
                <span className="rounded-[3px] border border-line bg-surface-card px-1.5 py-0.5 text-[10px] text-ink-muted">
                  Day {interval}
                </span>
                {index < intervals.length - 1 && <span className="text-[9.5px] text-ink-faint">→</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="email-signature">Email signature</Label>
        <Textarea
          id="email-signature"
          value={signature}
          onChange={(event) => setSignature(event.target.value)}
          className="min-h-[78px]"
          placeholder={"Your name\nRole · School\nemail@example.com"}
        />
        <p className="text-[10px] text-ink-faint">
          Stored for reference and future email integrations. Your saved emails are never altered.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-subtle/50 px-3 py-2">
        <p className="flex items-center gap-1.5 text-[10.5px] text-ink-muted">
          <Check className="size-3 text-[#3a956b]" />
          Ghosting is always manual — we never close an application for you.
        </p>
        <Button size="sm" onClick={save} disabled={pending}>
          {pending && <Loader2 className="size-3 animate-spin" />}
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
