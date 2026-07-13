"use client";

import ThemeToggle from "./ThemeToggle";

export default function SettingsClient() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
          Appearance
        </h2>
        <div className="flex items-center justify-between rounded-xl border border-border-app bg-surface p-4">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted">Choose light or dark mode</p>
          </div>
          <ThemeToggle />
        </div>
      </section>
    </div>
  );
}
