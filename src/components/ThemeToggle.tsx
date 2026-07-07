import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { resolvedTheme, setMode } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setMode(isDark ? "light" : "dark")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/50 text-foreground transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-secondary focus:outline-none"
    >
      {isDark ? (
        <Sun className="h-4.5 w-4.5 text-brand-orange" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-brand-green" />
      )}
    </button>
  );
}
