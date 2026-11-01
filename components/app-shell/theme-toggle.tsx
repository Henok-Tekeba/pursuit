"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const checked = mounted && resolvedTheme === "dark";
  return (
    <Switch
      checked={checked}
      onCheckedChange={(value) => setTheme(value ? "dark" : "light")}
      aria-label="Toggle dark mode"
    />
  );
}
