import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[5px] border px-1.5 py-0.5 text-[11.5px] font-medium leading-none",
  {
    variants: {
      variant: {
        default: "border-line bg-surface-subtle text-ink-secondary",
        outline: "border-line bg-transparent text-ink-secondary",
        green: "border-[#d9f0e5] bg-[#f1fbf6] text-[#2e8a61]",
        orange: "border-[#f5ead5] bg-[#fffaf1] text-[#c1842c]",
        red: "border-[#f8e1e5] bg-[#fff6f7] text-[#c24e63]",
        blue: "border-[#dcecf7] bg-[#f2f9fd] text-[#357ba9]",
        dark: "border-transparent bg-ink text-surface-card",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
