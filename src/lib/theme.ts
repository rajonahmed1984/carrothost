export type ThemeMode = "auto" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_MODE_KEY = "theme_mode";
export const THEME_RESOLVED_KEY = "theme_resolved";

const DAY_START_HOUR = 7;
const NIGHT_START_HOUR = 19;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function isValidMode(value: string | null): value is ThemeMode {
  return value === "auto" || value === "light" || value === "dark";
}

function setStorage(key: string, value: string): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures (private mode, disabled storage, etc.).
  }
}

function getStorage(key: string): string | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getMode(): ThemeMode {
  const storedMode = getStorage(THEME_MODE_KEY);
  if (isValidMode(storedMode)) {
    return storedMode;
  }

  setStorage(THEME_MODE_KEY, "auto");
  return "auto";
}

export function setMode(mode: ThemeMode): void {
  setStorage(THEME_MODE_KEY, mode);
}

export function resolveTheme(mode: ThemeMode, now = new Date()): ResolvedTheme {
  if (mode === "light" || mode === "dark") {
    return mode;
  }

  const hour = now.getHours();
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? "light" : "dark";
}

export function applyTheme(theme: ResolvedTheme): void {
  if (!isBrowser()) {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function setResolvedTheme(theme: ResolvedTheme): void {
  setStorage(THEME_RESOLVED_KEY, theme);
}

export function initThemeOnLoad(): { mode: ThemeMode; resolvedTheme: ResolvedTheme } {
  const mode = getMode();
  const resolvedTheme = resolveTheme(mode, new Date());

  applyTheme(resolvedTheme);
  setResolvedTheme(resolvedTheme);

  return { mode, resolvedTheme };
}
