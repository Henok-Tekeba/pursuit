import { cn, initialsFor } from "@/lib/utils";

const GRADIENTS = [
  "from-[#dfe8f5] to-[#c9d6e7] text-[#47627e]",
  "from-[#e9e2f5] to-[#d7cbe9] text-[#6e5a8c]",
  "from-[#f5e4dc] to-[#ecd1c2] text-[#8a5c46]",
  "from-[#e1efe6] to-[#c9e1d3] text-[#47755a]",
  "from-[#f5e9dc] to-[#ead6bd] text-[#806642]",
  "from-[#e3edf0] to-[#cbdee3] text-[#456a72]",
  "from-[#f2e1e8] to-[#e4c8d4] text-[#82566a]",
];

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function CompanyAvatar({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <span
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/[0.04] bg-white",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="" className="size-full object-cover" />
      </span>
    );
  }
  const gradient = GRADIENTS[hashString(name) % GRADIENTS.length];
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11.5px] font-semibold tracking-tight",
        gradient,
        className,
      )}
    >
      {initialsFor(name)}
    </span>
  );
}

export function PersonAvatar({
  name,
  src,
  className,
}: {
  name: string | null | undefined;
  src?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/[0.04] bg-surface-subtle text-[11.5px] font-medium text-ink-secondary",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initialsFor(name)
      )}
    </span>
  );
}
