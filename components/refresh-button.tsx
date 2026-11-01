"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function RefreshButton({
  label,
  className,
}: {
  label: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] text-ink-muted transition-colors hover:text-ink",
        className,
      )}
    >
      <RefreshCw
        className={cn("size-2.5 text-[#5b8def]", pending && "animate-spin")}
        strokeWidth={2.2}
      />
      {label}
    </button>
  );
}
