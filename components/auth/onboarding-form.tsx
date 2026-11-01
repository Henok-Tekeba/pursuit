"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import {
  cancelOnboardingAction,
  completeOnboardingAction,
  type OnboardingState,
} from "@/app/actions/onboarding";

const initialState: OnboardingState = { status: "idle" };

const inputClass =
  "h-[44px] w-full rounded-[10px] border border-[#e9e9eb] bg-white px-4 text-[13.5px] text-[#17171c] outline-none transition-colors placeholder:text-[#9a9aa2] focus:border-[#cfcfd4] focus:ring-2 focus:ring-black/[0.04]";

export function OnboardingForm({
  email,
  initialName,
  provider,
}: {
  email: string;
  initialName: string;
  provider: string;
}) {
  const [state, formAction, pending] = useActionState(completeOnboardingAction, initialState);
  const isGoogle = provider === "google";

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 text-[11px] font-medium text-[#2e8a61]">
        <CheckCircle2 className="size-3.5" />
        {isGoogle ? "Google verified" : "Email verified"}
      </div>
      <h1 className="mt-3 text-[35px] font-medium leading-[1.08] tracking-[-0.045em] text-[#0b0b0c] md:text-[41px]">
        Finish your account
      </h1>
      <p className="mt-3 max-w-[430px] text-[12.5px] leading-[1.55] text-[#74747c] md:text-[13px]">
        You&apos;re verified as <span className="font-medium text-[#303036]">{email}</span>. Add a
        few details so your workspace feels like yours.
      </p>

      <form action={formAction} className="mt-7 space-y-4">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="onboarding-name">
            <input
              id="onboarding-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={initialName}
              placeholder="Your full name"
              className={inputClass}
            />
          </Field>
          <Field label="Target role" htmlFor="onboarding-role">
            <input
              id="onboarding-role"
              name="targetRole"
              type="text"
              maxLength={120}
              placeholder="Product Design Intern"
              className={inputClass}
            />
          </Field>
          <Field label="University / school" htmlFor="onboarding-university">
            <input
              id="onboarding-university"
              name="university"
              type="text"
              maxLength={160}
              placeholder="Where you study"
              className={inputClass}
            />
          </Field>
          <Field label="Graduation year" htmlFor="onboarding-graduation">
            <input
              id="onboarding-graduation"
              name="graduationYear"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="2027"
              className={inputClass}
            />
          </Field>
          <Field label="Location" htmlFor="onboarding-location" className="sm:col-span-2">
            <input
              id="onboarding-location"
              name="location"
              type="text"
              maxLength={120}
              placeholder="City, country"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="rounded-[10px] border border-[#ebebed] bg-[#fbfbfb] p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[12px] font-medium text-[#2b2b30]">
              {isGoogle ? "Set a password (optional)" : "Create a password"}
            </p>
            <span className="text-[10px] text-[#96969d]">8+ characters</span>
          </div>
          <p className="mt-0.5 text-[10.5px] leading-relaxed text-[#8f8f95]">
            {isGoogle
              ? "You can sign in with Google without one. A password also lets you sign in with email."
              : "You'll use this with your email when you sign in next time."}
          </p>
          <div className="mt-3 grid gap-3.5 sm:grid-cols-2">
            <Field label="Password" htmlFor="onboarding-password">
              <input
                id="onboarding-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={200}
                required={!isGoogle}
                placeholder={isGoogle ? "Optional" : "Create a password"}
                className={inputClass}
              />
            </Field>
            <Field label="Confirm password" htmlFor="onboarding-confirm-password">
              <input
                id="onboarding-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={200}
                required={!isGoogle}
                placeholder={isGoogle ? "Optional" : "Repeat your password"}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-md border border-[#f4dfe3] bg-[#fff8f9] px-3 py-2 text-[11px] leading-relaxed text-[#b64c5e]"
          >
            {state.message}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="flex h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-[#0c0c0e] text-[13px] font-medium text-white transition-all hover:bg-[#1d1d22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 disabled:opacity-65"
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {pending ? "Creating your workspace…" : "Create my workspace"}
            {!pending && <ArrowRight className="size-3.5" />}
          </button>
        </div>
      </form>

      <form action={cancelOnboardingAction} className="mt-5 text-center">
        <button
          type="submit"
          className="text-[11.5px] font-medium text-[#8f8f95] underline-offset-2 transition-colors hover:text-[#2d2d31] hover:underline"
        >
          Use a different email
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label htmlFor={htmlFor} className="text-[11px] font-medium text-[#5f5f66]">
        {label}
      </label>
      {children}
    </div>
  );
}
