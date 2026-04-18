"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "theme";
const THEME_EVENT = "scriptforge-theme-change";

function getBrowserTheme() {
  if (typeof window === "undefined") return "light";

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

function subscribeTheme(callback) {
  if (typeof window === "undefined") return () => {};

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => callback();

  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  media.addEventListener("change", onChange);

  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
    media.removeEventListener("change", onChange);
  };
}

export default function ThemeToggle({ className = "" }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getBrowserTheme,
    () => "light"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = useCallback((nextTheme) => {
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
      document.cookie = `theme=${nextTheme}; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch {}

    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(THEME_EVENT));
    }
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200/30 bg-white/10 px-3 py-1 text-sm text-slate-900 dark:text-white backdrop-blur hover:bg-white/20 transition-colors dark:border-slate-800/60 ${className}`}
    >
      <span className="inline-block h-4 w-4 rounded-full bg-yellow-300 dark:hidden" />
      <span className="hidden h-4 w-4 rounded-full bg-emerald-400 dark:inline-block" />
      <span className="hidden sm:inline">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
