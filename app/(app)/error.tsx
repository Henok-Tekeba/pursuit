"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center p-8 text-center">
      <span className="grid size-11 place-items-center rounded-xl border border-line bg-surface-card text-[#c1842c] shadow-card">
        <AlertTriangle className="size-4" />
      </span>
      <h1 className="mt-4 text-[17.5px] font-medium text-ink">Something didn&apos;t load</h1>
      <p className="mt-1.5 max-w-[340px] text-[12px] leading-relaxed text-ink-muted">
        Your data is safe. Refresh this page and try again — if the issue continues, come back in a
        moment.
      </p>
      <Button size="sm" variant="outline" className="mt-4" onClick={reset}>
        <RotateCcw className="size-3.5" />
        Try again
      </Button>
    </div>
  );
}
