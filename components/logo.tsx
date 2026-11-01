import { cn } from "@/lib/utils";

export function LogoMark({
  className,
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-5", className)}
      fill="none"
    >
      <path d="M13.1 1.8 4.7 12.25h7.05V1.8Z" fill={color} />
      <path d="M10.9 22.2 19.3 11.75h-7.05V22.2Z" fill={color} />
    </svg>
  );
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="size-[22px]" />
      <span className="text-[15.5px] font-medium tracking-[-0.03em]">Internship Tracker</span>
    </div>
  );
}
