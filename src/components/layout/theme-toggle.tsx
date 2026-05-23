"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const THEME_STORAGE_KEY = "eavizat-theme";

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  window.dispatchEvent(new CustomEvent("eavizat-theme-change", { detail: theme }));
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      const nextTheme = storedTheme === "dark" ? "dark" : "light";
      setTheme(nextTheme);
      applyTheme(nextTheme);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="cursor-pointer gap-1.5"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Schimbă pe light mode" : "Schimbă pe dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="size-3.5" aria-hidden />
      ) : (
        <Moon className="size-3.5" aria-hidden />
      )}
      <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
    </Button>
  );
}
