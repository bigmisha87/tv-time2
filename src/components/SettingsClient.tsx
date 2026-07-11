"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

function OnOff({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="inline-flex gap-1 rounded-lg border border-border-app p-0.5">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            value === v ? "bg-accent text-black" : "text-muted"
          }`}
        >
          {v ? "On" : "Off"}
        </button>
      ))}
    </div>
  );
}

export default function SettingsClient() {
  const [badge, setBadge] = useState(true);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    try {
      setBadge(localStorage.getItem("notify-badge") !== "off");
    } catch {}
  }, []);

  function toggleBadge(next: boolean) {
    setBadge(next);
    try {
      localStorage.setItem("notify-badge", next ? "on" : "off");
    } catch {}
    window.dispatchEvent(new Event("tvtime:settings"));
  }

  function markSeen() {
    const today = new Date().toISOString().slice(0, 10);
    try {
      localStorage.setItem("neweps-seen", today);
    } catch {}
    window.dispatchEvent(new Event("tvtime:settings"));
    setSeen(true);
  }

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

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
          New-episode alerts
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-border-app bg-surface p-4">
            <div className="pr-4">
              <p className="text-sm font-medium">Show the new-episode badge</p>
              <p className="text-xs text-muted">
                The red number on the Upcoming tab
              </p>
            </div>
            <OnOff value={badge} onChange={toggleBadge} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border-app bg-surface p-4">
            <div className="pr-4">
              <p className="text-sm font-medium">Mark all as seen</p>
              <p className="text-xs text-muted">
                Clears the badge now; it returns when the next episode airs
              </p>
            </div>
            <button
              type="button"
              onClick={markSeen}
              className="shrink-0 rounded-lg border border-accent px-3 py-1.5 text-sm font-medium text-accent"
            >
              {seen ? "Done ✓" : "Mark seen"}
            </button>
          </div>

          <p className="px-1 text-xs text-muted">
            Want to skip alerts for one show and wait for the whole season? Open
            that show and turn on “Wait for full season”.
          </p>
        </div>
      </section>
    </div>
  );
}
