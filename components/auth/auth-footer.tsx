import Link from "next/link";

export function AuthFooter() {
  return (
    <div className="flex items-center justify-center gap-4 text-[11px] text-[#8b8b93]">
      <a
        href="mailto:tekebahenok6@gmail.com"
        className="transition-colors hover:text-[#44444b]"
      >
        Help
      </a>
      <span className="h-3 w-px bg-[#dedee1]" />
      <Link href="/terms" className="transition-colors hover:text-[#44444b]">
        Terms
      </Link>
      <span className="h-3 w-px bg-[#dedee1]" />
      <Link href="/privacy" className="transition-colors hover:text-[#44444b]">
        Privacy
      </Link>
    </div>
  );
}
