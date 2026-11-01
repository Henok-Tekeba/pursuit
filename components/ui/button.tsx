import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-[13.5px] font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-card disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-surface-card shadow-[0_1px_2px_rgba(16,24,40,0.16)] hover:opacity-90 active:scale-[0.99]",
        outline:
          "border border-line bg-surface-card text-ink shadow-[0_1px_1px_rgba(16,24,40,0.02)] hover:border-line-strong hover:bg-surface-hover",
        ghost: "text-ink-secondary hover:bg-surface-hover hover:text-ink",
        soft: "bg-surface-hover text-ink hover:bg-surface-subtle",
        destructive:
          "bg-[#d24f62] text-white shadow-[0_1px_2px_rgba(16,24,40,0.1)] hover:bg-[#c24356]",
        dangerGhost: "text-[#c24e63] hover:bg-[#fdf0f2]",
        link: "h-auto rounded-none p-0 text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3.5",
        xs: "h-8 px-3 text-[12.5px]",
        icon: "size-9",
        iconSm: "size-8",
        iconXs: "size-7 rounded-md",
        pill: "h-9 rounded-full px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
