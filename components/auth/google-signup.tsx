"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { GoogleIcon } from "@/components/auth/social-icons";

export function GoogleSignup({ googleEnabled }: { googleEnabled: boolean }) {
  return (
    <div className="animate-fade-in">
      <h1 className="text-[40px] font-medium leading-[1.02] tracking-[-0.055em] text-[#101012] md:text-[46px]">
        Create your account.
      </h1>
      <p className="mt-3 max-w-[360px] text-[13px] leading-[1.65] text-[#77777d]">
        Continue with Google. We&apos;ll verify your email, then ask for a few details to set up
        your private workspace.
      </p>

      {googleEnabled ? (
        <button
          type="button"
          onClick={() => {
            window.location.href = "/api/auth/oauth/google";
          }}
          className="mt-7 flex h-11 w-full items-center justify-center gap-2.5 rounded-[8px] bg-[#101012] text-[12.5px] font-medium text-white transition-colors hover:bg-[#232326] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
        >
          <span className="grid size-5 place-items-center rounded-full bg-white">
            <GoogleIcon className="size-3.5" />
          </span>
          Continue with Google
          <ArrowRight className="size-3.5 text-white/55" />
        </button>
      ) : (
        <div className="mt-7 rounded-[9px] border border-[#e3dacb] bg-[#fffcf5] p-4">
          <p className="text-[12.5px] font-medium text-[#2b2b30]">Google sign-in is almost ready</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[#8f8f95]">
            The Google OAuth client still needs to be connected to this deployment. You can sign in
            with an existing email and password, or open the demo workspace in the meantime.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/login"
              className="inline-flex h-8 items-center gap-1.5 rounded-[7px] bg-[#101012] px-3 text-[11px] font-medium text-white transition-opacity hover:opacity-85"
            >
              Sign in with email
              <ArrowRight className="size-3" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-8 items-center rounded-[7px] border border-[#ddd3c4] bg-[#fffcf5] px-3 text-[11px] font-medium text-[#2d2d31] transition-colors hover:border-[#c9c0b2]"
            >
              Go to login
            </Link>
          </div>
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-[10.5px] leading-relaxed text-[#96969d]">
        <ShieldCheck className="size-3" />
        Google verifies your email. We never see or store your Google password.
      </p>

      <p className="mt-7 border-t border-[#e7dfd1] pt-5 text-[12px] text-[#7f7f87]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[#2d2d31] underline underline-offset-2">
          Sign in
        </Link>
      </p>

      <p className="mt-6 max-w-[330px] text-[10px] leading-[1.6] text-[#a0a0a5]">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-[#55555c]">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-[#55555c]">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
