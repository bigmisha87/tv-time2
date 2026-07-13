"use client";

import { useState } from "react";
import ShowCard from "./ShowCard";

export interface FavoriteCard {
  tmdbId: number;
  name: string;
  posterUrl: string | null;
  badge: number;
  progress: number;
}

/**
 * Favorite shows, collapsed by default behind a button. Uses explicit React
 * state rather than a native <details> so the show/hide works in every
 * browser regardless of its default stylesheet.
 */
export default function FavoritesSection({
  favorites,
}: {
  favorites: FavoriteCard[];
}) {
  const [open, setOpen] = useState(false);
  if (favorites.length === 0) return null;

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-border-app bg-surface p-4 text-left transition-colors hover:border-accent"
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-muted">
          ❤️ Favorite shows ({favorites.length})
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {favorites.map((f) => (
            <ShowCard
              key={f.tmdbId}
              tmdbId={f.tmdbId}
              name={f.name}
              posterUrl={f.posterUrl}
              badge={f.badge}
              progress={f.progress}
            />
          ))}
        </div>
      )}
    </section>
  );
}
