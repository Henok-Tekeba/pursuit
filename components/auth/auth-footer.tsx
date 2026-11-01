"use client";

import { useState } from "react";
import { LegalSheet } from "./legal-sheet";

export function AuthFooter() {
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);
  return (
    <>
      <div className="flex items-center justify-center gap-4 text-[11px] text-[#8b8b93]">
        <a
          href="mailto:hello@pursuit.app"
          className="transition-colors hover:text-[#44444b]"
        >
          Help
        </a>
        <span className="h-3 w-px bg-[#dedee1]" />
        <button
          type="button"
          onClick={() => setLegal("terms")}
          className="transition-colors hover:text-[#44444b]"
        >
          Terms
        </button>
        <span className="h-3 w-px bg-[#dedee1]" />
        <button
          type="button"
          onClick={() => setLegal("privacy")}
          className="transition-colors hover:text-[#44444b]"
        >
          Privacy
        </button>
      </div>
      <LegalSheet type={legal} onOpenChange={(open) => !open && setLegal(null)} />
    </>
  );
}
