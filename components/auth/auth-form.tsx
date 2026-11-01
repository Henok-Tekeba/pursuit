"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import {
  demoSignInAction,
  passwordSignInAction,
  passwordSignUpAction,
  type PasswordAuthState,
} from "@/app/actions/auth";

const initialState: PasswordAuthState = { status: "idle" };

const ERROR_MESSAGES: Record<string, string> = {
  "expired-link": "That sign-in link has expired. Sign in with your password below.",
  "invalid-link": "That sign-in link isn't valid. Sign in with your password below.",
  "missing-code": "That sign-in link is incomplete. Please try signing in again.",
  "auth-failed": "We couldn't complete sign-in. Please try again.",
  "oauth-unavailable": "Social sign-in isn't configured. Use your email and password below.",
  "oauth-failed": "Social sign-in couldn't start. Please try again or use your password.",
  "demo-unavailable": "The demo workspace isn't available in this environment.",
};

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
  const action = isSignup ? passwordSignUpAction : passwordSignInAction;
  const [state, formAction, pending] = useActionState(action, initialState);
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
      <div className="text-center">
        <h1 className="text-[38px] font-medium leading-[1.08] tracking-[-0.045em] text-[#0b0b0c] md:text-[44px]">
          {isSignup ? "Create your account" : "Welcome back!"}
        </h1>
        <p className="mx-auto mt-3 max-w-[330px] text-[12.5px] leading-[1.55] text-[#74747c] md:text-[13.5px]">
          {isSignup
            ? "Start with a clean workspace. Every application, email, and follow-up stays private to you."
            : "Your work, your team, your flow — all in one place."}
        </p>
      </div>

      {hasSocial && (
        <>
          <div
            className={`mt-8 grid gap-2.5 ${
              socialProviders.google && socialProviders.apple ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {socialProviders.google && (
              <button
                type="button"
                onClick={() => onSocial("google")}
                className="flex h-[42px] items-center justify-center gap-2 rounded-full border border-[#e9e9eb] bg-white px-2 text-[11.5px] font-medium text-[#27272d] transition-colors hover:border-[#d7d7db] hover:bg-[#fcfcfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 md:text-[12px]"
              >
                <GoogleIcon className="size-4" />
                {isSignup ? "Sign up with Google" : "Sign In with Google"}
              </button>
            )}
            {socialProviders.apple && (
              <button
                type="button"
                onClick={() => onSocial("apple")}
                className="flex h-[42px] items-center justify-center gap-2 rounded-full border border-[#e9e9eb] bg-white px-2 text-[11.5px] font-medium text-[#27272d] transition-colors hover:border-[#d7d7db] hover:bg-[#fcfcfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 md:text-[12px]"
              >
                <AppleIcon className="size-4" />
                {isSignup ? "Sign up with Apple" : "Sign In with Apple"}
              </button>
            )}
          </div>

          <div className="my-[24px] flex items-center gap-3">
            <span className="h-px flex-1 bg-[#e9e9eb]" />
            <span className="text-[11.5px] text-[#8f8f96]">Or</span>
            <span className="h-px flex-1 bg-[#e9e9eb]" />
          </div>
        </>
      )}

      <form
        action={formAction}
        onSubmit={() => setSocialError("")}
        className="space-y-3.5"
      >
        {isSignup && (
          <div>
            <label htmlFor="name" className="sr-only">
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
              placeholder="Enter your full name"
              aria-invalid={Boolean(error)}
              className="h-[44px] w-full rounded-[10px] border border-[#e9e9eb] bg-white px-4 text-[13.5px] text-[#17171c] outline-none transition-colors placeholder:text-[#9a9aa2] focus:border-[#cfcfd4] focus:ring-2 focus:ring-black/[0.04]"
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
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
            placeholder="Enter your email"
            aria-invalid={Boolean(error)}
            className="h-[44px] w-full rounded-[10px] border border-[#e9e9eb] bg-white px-4 text-[13.5px] text-[#17171c] outline-none transition-colors placeholder:text-[#9a9aa2] focus:border-[#cfcfd4] focus:ring-2 focus:ring-black/[0.04]"
          />
        </div>
        <div>
          <div className="relative">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={8}
              maxLength={200}
              placeholder={isSignup ? "Create a password (8+ characters)" : "Enter your password"}
              aria-invalid={Boolean(error)}
              className="h-[44px] w-full rounded-[10px] border border-[#e9e9eb] bg-white pl-4 pr-11 text-[13.5px] text-[#17171c] outline-none transition-colors placeholder:text-[#9a9aa2] focus:border-[#cfcfd4] focus:ring-2 focus:ring-black/[0.04]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#a3a3aa] transition-colors hover:text-[#55555c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
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
            className="rounded-md border border-[#f4dfe3] bg-[#fff8f9] px-3 py-2 text-[11px] leading-relaxed text-[#b64c5e]"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#0c0c0e] text-[13px] font-medium text-white transition-all hover:bg-[#1d1d22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 disabled:opacity-65"
        >
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          {pending ? (isSignup ? "Creating your workspace…" : "Signing in…") : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-[22px] text-center text-[12px] text-[#7f7f87]">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#2d2d31] underline underline-offset-2">
              Sign In
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-[#2d2d31] underline underline-offset-2">
              Sign Up
            </Link>
          </>
        )}
      </p>

      {!isSignup && demoEnabled && (
        <div className="mt-5 rounded-lg border border-[#ebebed] bg-[#fbfbfb] px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11.5px] font-medium text-[#2b2b30]">Explore the demo</p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-[#8f8f95]">
                Elena&apos;s sample workspace, with every feature filled in.
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
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#e3e3e6] bg-white px-3 text-[11px] font-medium text-[#2d2d31] transition-colors hover:border-[#cfcfd4] hover:bg-[#fdfdfd] disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-3 animate-spin" /> : <ArrowRight className="size-3" />}
      {pending ? "Opening…" : "Open demo"}
    </button>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.67-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06L5.85 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.05 12.54c-.03-2.9 2.37-4.3 2.48-4.37-1.35-1.97-3.45-2.24-4.2-2.27-1.79-.18-3.49 1.05-4.4 1.05-.9 0-2.3-1.02-3.78-1-1.94.03-3.73 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.5.96 1.39 2.11 2.95 3.62 2.89 1.45-.06 2-.94 3.75-.94 1.75 0 2.24.94 3.77.91 1.55-.03 2.54-1.42 3.49-2.82 1.1-1.61 1.55-3.17 1.58-3.25-.03-.02-3.03-1.17-3.06-4.56ZM14.2 3.9c.8-.97 1.34-2.32 1.19-3.66-1.15.05-2.55.77-3.38 1.74-.74.85-1.39 2.22-1.21 3.53 1.29.1 2.6-.65 3.4-1.61Z" />
    </svg>
  );
}
