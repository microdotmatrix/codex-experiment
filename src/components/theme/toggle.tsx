"use client";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useMetaColor } from "@/hooks/use-meta-color";
import { meta } from "@/lib/config";

export const ThemeToggle = ({ iconSize = "size-5" }: { iconSize?: string }) => {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const { setMetaColor } = useMetaColor();

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    setMetaColor(
      resolvedTheme === "dark" ? meta.colors.light : meta.colors.dark
    );
  }, [resolvedTheme, setTheme, setMetaColor]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Button
      aria-label="Toggle theme"
      onClick={toggleTheme}
      size="icon"
      variant="outline"
    >
      {resolvedTheme === "light" ? (
        <Icon
          className={iconSize}
          icon="line-md:moon-to-sunny-outline-loop-transition"
          key={resolvedTheme}
        />
      ) : (
        <Icon
          className={iconSize}
          icon="line-md:sunny-outline-to-moon-loop-transition"
          key={resolvedTheme}
        />
      )}
    </Button>
  );
};
