"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import {
  demoSignInAction,
  passwordSignInAction,
  type PasswordAuthState,
} from "@/app/actions/auth";
import { AppleIcon, GoogleIcon } from "@/components/auth/social-icons";

const initialState: PasswordAuthState = { status: "idle" };

const ERROR_MESSAGES: Record<string, string> = {
  "expired-link": "That sign-in link has expired. Sign in with your password below.",
  "invalid-link": "That sign-in link isn't valid. Sign in with your password below.",
  "missing-code": "That sign-in link is incomplete. Please try signing in again.",
  "auth-failed": "We couldn't complete sign-in. Please try again.",
  "oauth-unavailable": "Social sign-in isn't configured. Use your email and password below.",
  "oauth-failed": "Social sign-in couldn't start. Please try again or use your password.",
  "demo-unavailable": "The demo workspace isn't available in this environment.",
  "rate-limited": "Too many attempts. Wait a few minutes and try again.",
};

const fieldClass =
  "h-11 w-full rounded-[8px] border border-[#e3dacb] bg-[#fbf6ec] px-3.5 text-[13px] text-[#101012] outline-none transition-colors placeholder:text-[#a0a0a5] focus:border-[#c9c9c6] focus:ring-2 focus:ring-black/[0.04]";
const labelClass = "mb-1.5 block text-[11px] font-medium text-[#5f5f66]";

export function AuthForm({
  mode,
  socialProviders,
  initialError,
  demoEnabled = false,
}: {
  mode: "login" | "signup";
  socialProviders: { google: boolean; apple: boolean };
  initialError?: string;
  demoEnabled?: boolean;
}) {
  const isSignup = mode === "signup";
  const [state, formAction, pending] = useActionState(passwordSignInAction, initialState);
  const [socialError, setSocialError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const hasSocial = socialProviders.google || socialProviders.apple;

  const error =
    state.status === "error"
      ? state.message
      : socialError ||
        (initialError ? ERROR_MESSAGES[initialError] ?? "Something went wrong. Please try again." : "");

  const onSocial = (provider: "google" | "apple") => {
    setSocialError("");
    if (!socialProviders[provider]) {
      setSocialError(
        `${provider === "google" ? "Google" : "Apple"} sign-in isn't enabled yet. Use email and password to continue.`,
      );
      return;
    }
    window.location.href = `/api/auth/oauth/${provider}`;
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-[40px] font-medium leading-[1.02] tracking-[-0.055em] text-[#101012] md:text-[46px]">
        {isSignup ? "Create your account." : "Welcome back."}
      </h1>
      <p className="mt-3 max-w-[350px] text-[13px] leading-[1.65] text-[#77777d]">
        {isSignup
          ? "Start with a clean workspace. Every application, email, and follow-up stays private to you."
          : "Sign in to pick up where you left off. Your applications, emails, and follow-ups are waiting."}
      </p>

      {hasSocial && (
        <>
          <div
            className={`mt-7 grid gap-2 ${
              socialProviders.google && socialProviders.apple ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {socialProviders.google && (
              <button
                type="button"
                onClick={() => onSocial("google")}
                className="flex h-11 items-center justify-center gap-2 rounded-[8px] border border-[#e3dacb] bg-[#fbf6ec] px-3 text-[12px] font-medium text-[#27272d] transition-colors hover:border-[#d5cbbd] hover:bg-[#fbf7ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
              >
                <GoogleIcon className="size-4" />
                Continue with Google
              </button>
            )}
            {socialProviders.apple && (
              <button
                type="button"
                onClick={() => onSocial("apple")}
                className="flex h-11 items-center justify-center gap-2 rounded-[8px] border border-[#e3dacb] bg-[#fbf6ec] px-3 text-[12px] font-medium text-[#27272d] transition-colors hover:border-[#d5cbbd] hover:bg-[#fbf7ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
              >
                <AppleIcon className="size-4" />
                Continue with Apple
              </button>
            )}
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#e9e9e6]" />
            <span className="text-[10.5px] text-[#9a9aa1]">or continue with email</span>
            <span className="h-px flex-1 bg-[#e9e9e6]" />
          </div>
        </>
      )}

      <form action={formAction} onSubmit={() => setSocialError("")} className="space-y-4">
        {isSignup && (
          <div>
            <label htmlFor="name" className={labelClass}>
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              placeholder="Your full name"
              aria-invalid={Boolean(error)}
              className={fieldClass}
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="you@example.com"
            aria-invalid={Boolean(error)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={8}
              maxLength={200}
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
              aria-invalid={Boolean(error)}
              className={`${fieldClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-[#a0a0a5] transition-colors hover:text-[#55555c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {isSignup && (
            <p className="mt-1.5 flex items-center gap-1 text-[10.5px] text-[#96969d]">
              <LockKeyhole className="size-2.5" />
              At least 8 characters. Your workspace is private to this account.
            </p>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-[7px] border border-[#f4dfe3] bg-[#fff8f9] px-3 py-2 text-[11px] leading-relaxed text-[#b64c5e]"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[#101012] text-[12.5px] font-medium text-white transition-colors hover:bg-[#232326] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 disabled:opacity-65"
        >
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          {pending
            ? isSignup
              ? "Creating your workspace..."
              : "Signing in..."
            : isSignup
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-[12px] text-[#7f7f87]">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#2d2d31] underline underline-offset-2">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Pursuit?{" "}
            <Link href="/signup" className="font-medium text-[#2d2d31] underline underline-offset-2">
              Create an account
            </Link>
          </>
        )}
      </p>

      {!isSignup && demoEnabled && (
        <div className="mt-8 border-t border-[#e7dfd1] pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[#2b2b30]">Just exploring?</p>
              <p className="mt-1 max-w-[230px] text-[10.5px] leading-[1.55] text-[#8f8f95]">
                Open Elena&apos;s read-only demo workspace and look around.
              </p>
            </div>
            <form action={demoSignInAction} className="shrink-0">
              <DemoButton />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DemoButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[7px] border border-[#ddd3c4] bg-[#fbf6ec] px-3 text-[11px] font-medium text-[#2d2d31] transition-colors hover:border-[#c9c0b2] hover:bg-[#fbf7ef] disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-3 animate-spin" /> : null}
      {pending ? "Opening..." : "Open demo"}
    </button>
  );
}
