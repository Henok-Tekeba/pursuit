import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#e0e0e0] p-6">
      <div className="w-full max-w-[380px] rounded-xl border border-white/60 bg-white p-8 text-center shadow-shell">
        <div className="mx-auto grid size-10 place-items-center rounded-lg bg-[#111114] text-white">
          <LogoMark className="size-5 text-white" />
        </div>
        <p className="mt-5 text-[9px] font-medium uppercase tracking-[0.14em] text-[#a0a0a6]">
          404: Not found
        </p>
        <h1 className="mt-2 text-[24px] font-medium tracking-[-0.04em] text-[#17171c]">
          This page isn&apos;t here
        </h1>
        <p className="mt-2 text-[11px] leading-relaxed text-[#8b8b92]">
          The application or page you were looking for may have been deleted, or the link might be
          incomplete.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-full bg-[#0c0c0e] px-4 text-[10.5px] font-medium text-white transition-colors hover:bg-[#1d1d22]"
        >
          <ArrowLeft className="size-3.5" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
