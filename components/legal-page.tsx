import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/logo";

export type LegalSection = {
  heading: string;
  body: string[];
};

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-dvh bg-surface-main">
      <div className="mx-auto w-full max-w-2xl px-6 pb-20 pt-10 md:px-8 md:pt-14">
        <div className="flex items-center justify-between gap-4">
          <Link href="/login" className="flex items-center gap-2 text-ink">
            <LogoMark className="h-7 w-[22px]" />
            <span className="text-[15px] font-medium tracking-[-0.03em]">Pursuit</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3" />
            Back
          </Link>
        </div>

        <p className="mt-14 text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-faint">
          Pursuit
        </p>
        <h1 className="mt-3 text-[36px] font-medium leading-[1.08] tracking-[-0.045em] text-ink md:text-[44px]">
          {title}
        </h1>
        <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">{intro}</p>

        <div className="mt-10 space-y-8 border-t border-line pt-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-[13.5px] font-medium text-ink">{section.heading}</h2>
              <div className="mt-2 space-y-2.5">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-[12.5px] leading-[1.7] text-ink-secondary">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-line pt-5 text-[11px] text-ink-faint">
          <Link href="/privacy" className="transition-colors hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-ink">
            Terms
          </Link>
          <a href="mailto:tekebahenok6@gmail.com" className="transition-colors hover:text-ink">
            Contact
          </a>
          <span className="ml-auto">Last updated November 1, 2026</span>
        </div>
      </div>
    </main>
  );
}
