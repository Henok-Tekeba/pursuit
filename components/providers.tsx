"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <TooltipProvider delayDuration={250}>
        {children}
        <Toaster
          position="bottom-right"
          closeButton={false}
          toastOptions={{
            classNames: {
              toast:
                "!rounded-lg !border !border-line !bg-surface-card !text-ink !shadow-float !text-[13.5px]",
              description: "!text-ink-muted",
              actionButton: "!bg-ink !text-surface-card",
            },
          }}
        />
      </TooltipProvider>
    </NextThemesProvider>
  );
}
