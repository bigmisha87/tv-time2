"use client";

import Link from "next/link";
import { POSTER_GRID_SIZES, posterSrcSet } from "@/lib/images";
import type { TmdbSearchResult } from "@/lib/tmdb";
import PosterPlaceholder from "./PosterPlaceholder";

export function premiereLabel(date: string | null | undefined): string | null {
  if (!date) return null;
  const formatted = new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const days = Math.round(
    (new Date(date + "T00:00:00Z").getTime() - Date.now()) / 86_400_000
  );
  if (days <= 0) return formatted;
  return `${formatted} · in ${days}d`;
}

/**
 * A single show poster with an add-to-my-shows button. Used both in the
 * horizontal Discover rows (`width` gives it a fixed scroll width) and in the
 * full-list grids (no `width`, so it fills the grid cell).
 */
export default function DiscoverCard({
  r,
  isAdded,
  onAdd,
  showPremiere,
  width,
}: {
  r: TmdbSearchResult;
  isAdded: boolean;
  onAdd: (e: React.MouseEvent, tmdbId: number) => void;
  showPremiere?: boolean;
  width?: boolean;
}) {
  const premiere = showPremiere ? premiereLabel(r.firstAirDate) : null;
  return (
    <Link
      href={`/shows/${r.tmdbId}`}
      className={`group block transition-transform active:scale-95 md:hover:scale-105 ${
        width ? "w-28 shrink-0 sm:w-32" : ""
      }`}
    >
      <div className="relative overflow-hidden rounded-lg bg-surface shadow-md">
        <div className="aspect-[2/3] w-full">
          {r.posterPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://image.tmdb.org/t/p/w342${r.posterPath}`}
              srcSet={posterSrcSet(r.posterPath)}
              // Rows render fixed-width cards; the search and genre grids
              // share the same breakpoints as the rest of the app.
              sizes={width ? "128px" : POSTER_GRID_SIZES}
              alt={r.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <PosterPlaceholder name={r.name} />
          )}
        </div>
        <button
          onClick={(e) => onAdd(e, r.tmdbId)}
          disabled={isAdded}
          aria-label={isAdded ? `${r.name} added` : `Add ${r.name}`}
          className={`absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg border text-lg font-bold backdrop-blur ${
            isAdded
              ? "border-accent bg-accent text-black"
              : "border-accent bg-black/50 text-accent"
          }`}
        >
          {isAdded ? "✓" : "+"}
        </button>
      </div>
      <p className="mt-1.5 truncate text-sm font-semibold">
        {r.name}
        {r.year && <span className="font-normal text-muted"> ({r.year})</span>}
      </p>
      {premiere && (
        <p className="truncate text-[11px] font-medium text-accent">
          {premiere}
        </p>
      )}
    </Link>
  );
}
