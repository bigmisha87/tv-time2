"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  // Read whatever the no-flash script already applied.
  useEffect(() => {
    const current = document.documentElement.getAttribute(
      "data-theme"
    ) as Theme | null;
    if (current === "light" || current === "dark") setTheme(current);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <div className="inline-flex gap-1 rounded-lg border border-border-app p-0.5">
      {(["dark", "light"] as Theme[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => choose(t)}
          aria-label={`${t} theme`}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            theme === t ? "bg-accent text-black" : "text-muted"
          }`}
        >
          {t === "dark" ? "🌙 Dark" : "☀️ Light"}
        </button>
      ))}
    </div>
  );
}
