export const dynamic = "force-dynamic";

import Link from "next/link";
import SettingsClient from "@/components/SettingsClient";
import { getAllShows } from "@/lib/store";

export default async function SettingsPage() {
  const shows = await getAllShows();
  const waiting = shows
    .filter((s) => s.followed && s.seasonWait)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Settings</h1>

      <SettingsClient />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
          Waiting for full season
        </h2>
        {waiting.length === 0 ? (
          <p className="rounded-xl border border-border-app bg-surface p-4 text-sm text-muted">
            No shows set to wait. Open any show and turn on “Wait for full
            season” to silence its new-episode alerts.
          </p>
        ) : (
          <ul className="divide-y divide-border-app overflow-hidden rounded-xl border border-border-app bg-surface">
            {waiting.map((s) => (
              <li key={s.tmdbId}>
                <Link
                  href={`/shows/${s.tmdbId}`}
                  className="flex items-center justify-between p-3 text-sm hover:text-accent"
                >
                  <span className="truncate">{s.name}</span>
                  <span className="shrink-0 text-xs text-muted">Manage →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
