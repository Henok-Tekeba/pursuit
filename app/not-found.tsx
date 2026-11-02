import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-main p-6">
      <div className="w-full max-w-[380px] rounded-xl border border-line bg-surface-card p-8 text-center shadow-shell">
        <div className="mx-auto grid size-10 place-items-center rounded-lg bg-ink text-surface-card">
          <LogoMark className="size-5" />
        </div>
        <p className="mt-5 text-[9px] font-medium uppercase tracking-[0.14em] text-ink-faint">
          404: Not found
        </p>
        <h1 className="mt-2 text-[24px] font-medium tracking-[-0.04em] text-ink">
          This page isn&apos;t here
        </h1>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
          The application or page you were looking for may have been deleted, or the link might be
          incomplete.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-full bg-ink px-4 text-[10.5px] font-medium text-surface-card transition-opacity hover:opacity-85"
        >
          <ArrowLeft className="size-3.5" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
