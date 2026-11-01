"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { GoogleIcon } from "@/components/auth/social-icons";

export function GoogleSignup({ googleEnabled }: { googleEnabled: boolean }) {
  return (
    <div className="animate-fade-in text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full border border-[#e9e9eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <GoogleIcon className="size-5" />
      </div>

      <h1 className="mt-5 text-[38px] font-medium leading-[1.08] tracking-[-0.045em] text-[#0b0b0c] md:text-[44px]">
        Create your account
      </h1>
      <p className="mx-auto mt-3 max-w-[340px] text-[12.5px] leading-[1.55] text-[#74747c] md:text-[13.5px]">
        Continue with Google. Google verifies your email, then we&apos;ll collect a few details
        and build your private workspace.
      </p>

      {googleEnabled ? (
        <button
          type="button"
          onClick={() => {
            window.location.href = "/api/auth/oauth/google";
          }}
          className="mt-8 flex h-[46px] w-full items-center justify-center gap-2.5 rounded-full border border-[#e3e3e6] bg-white text-[13px] font-medium text-[#27272d] shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:border-[#cfcfd4] hover:bg-[#fcfcfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
        >
          <GoogleIcon className="size-[18px]" />
          Continue with Google
          <ArrowRight className="size-3.5 text-[#8f8f95]" />
        </button>
      ) : (
        <div className="mt-8 rounded-xl border border-[#e9e9eb] bg-[#fbfbfb] p-4 text-left">
          <p className="text-[12.5px] font-medium text-[#2b2b30]">Google sign-in is almost ready</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[#8f8f95]">
            The Google OAuth client still needs to be connected to this deployment. You can sign in
            with an existing email and password, or open the demo workspace in the meantime.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/login"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#0c0c0e] px-3 text-[11px] font-medium text-white transition-opacity hover:opacity-85"
            >
              Sign in with email
              <ArrowRight className="size-3" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-8 items-center rounded-full border border-[#e3e3e6] bg-white px-3 text-[11px] font-medium text-[#2d2d31] transition-colors hover:border-[#cfcfd4]"
            >
              Go to login
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-1.5 text-[10.5px] leading-relaxed text-[#96969d]">
        <ShieldCheck className="size-3" />
        We never see your Google password or store it.
      </div>

      <p className="mt-[22px] text-center text-[12px] text-[#7f7f87]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[#2d2d31] underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
