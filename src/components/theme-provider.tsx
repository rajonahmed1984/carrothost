import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  applyTheme,
  getMode,
  initThemeOnLoad,
  resolveTheme,
  setMode as persistMode,
  setResolvedTheme,
  type ResolvedTheme,
  type ThemeMode,
} from "@/lib/theme";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialResolvedTheme(): ResolvedTheme {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => (typeof window === "undefined" ? "auto" : getMode()));
  const [resolvedTheme, setResolvedThemeState] = useState<ResolvedTheme>(getInitialResolvedTheme);
  const intervalRef = useRef<number | null>(null);
  const modeRef = useRef<ThemeMode>(mode);
  const resolvedThemeRef = useRef<ResolvedTheme>(resolvedTheme);

  const applyResolvedThemeState = useCallback((nextResolvedTheme: ResolvedTheme) => {
    if (resolvedThemeRef.current === nextResolvedTheme) {
      return;
    }

    applyTheme(nextResolvedTheme);
    setResolvedTheme(nextResolvedTheme);
    resolvedThemeRef.current = nextResolvedTheme;
    setResolvedThemeState(nextResolvedTheme);
  }, []);

  useEffect(() => {
    const initial = initThemeOnLoad();
    modeRef.current = initial.mode;
    resolvedThemeRef.current = initial.resolvedTheme;
    setModeState(initial.mode);
    setResolvedThemeState(initial.resolvedTheme);
  }, []);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    resolvedThemeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  const updateMode = useCallback((nextMode: ThemeMode) => {
    persistMode(nextMode);
    const nextResolvedTheme = resolveTheme(nextMode, new Date());
    applyResolvedThemeState(nextResolvedTheme);
    modeRef.current = nextMode;
    setModeState(nextMode);
  }, [applyResolvedThemeState]);

  useEffect(() => {
    const stopWatcher = () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const runAutoCheck = () => {
      const currentMode = getMode();
      if (currentMode !== "auto") {
        stopWatcher();
        if (modeRef.current !== currentMode) {
          modeRef.current = currentMode;
          setModeState(currentMode);
          applyResolvedThemeState(resolveTheme(currentMode, new Date()));
        }
        return;
      }

      applyResolvedThemeState(resolveTheme("auto", new Date()));
    };

    if (mode !== "auto") {
      stopWatcher();
      return stopWatcher;
    }

    runAutoCheck();
    stopWatcher();
    intervalRef.current = window.setInterval(runAutoCheck, 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runAutoCheck();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopWatcher();
    };
  }, [mode, applyResolvedThemeState]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedTheme,
      setMode: updateMode,
    }),
    [mode, resolvedTheme, updateMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
