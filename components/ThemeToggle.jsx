"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";

export default function ThemeToggle({ className = "" }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    let initial = saved;
    if (!initial) {
      initial = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, next);
      // Persist to cookie so the server can render with the correct theme
      document.cookie = `theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch {}
  };

  if (!mounted) return null;

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
