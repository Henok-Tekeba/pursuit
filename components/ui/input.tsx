import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-line bg-surface-card px-3.5 text-[13.5px] text-ink shadow-[0_1px_1px_rgba(16,24,40,0.02)] outline-none transition-colors placeholder:text-ink-faint focus:border-[#c9c9ce] focus:ring-2 focus:ring-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50 dark:focus:border-white/20 dark:focus:ring-white/5",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[92px] w-full resize-y rounded-lg border border-line bg-surface-card px-3 py-3 text-[13.5px] leading-relaxed text-ink shadow-[0_1px_1px_rgba(16,24,40,0.02)] outline-none transition-colors placeholder:text-ink-faint focus:border-[#c9c9ce] focus:ring-2 focus:ring-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50 dark:focus:border-white/20 dark:focus:ring-white/5",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
