"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addShow } from "@/lib/actions";
import type { TmdbSearchResult } from "@/lib/tmdb";
import PosterPlaceholder from "./PosterPlaceholder";

function premiereLabel(date: string | null | undefined): string | null {
  if (!date) return null;
  const formatted = new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const days = Math.round(
    (new Date(date + "T00:00:00Z").getTime() - Date.now()) / 86_400_000
  );
  if (days <= 0) return formatted;
  return `${formatted} · in ${days} day${days === 1 ? "" : "s"}`;
}

export default function SearchClient({
  existingIds,
  upcoming,
  recommended,
}: {
  existingIds: number[];
  upcoming: TmdbSearchResult[];
  recommended: TmdbSearchResult[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [added, setAdded] = useState<Set<number>>(new Set(existingIds));
  const [, startTransition] = useTransition();

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setSearching(false);
    }
  }

  function handleAdd(e: React.MouseEvent, tmdbId: number) {
    e.preventDefault();
    e.stopPropagation();
    setAdded((prev) => new Set(prev).add(tmdbId));
    startTransition(() => addShow(tmdbId));
  }

  function Card({
    r,
    showPremiere,
  }: {
    r: TmdbSearchResult;
    showPremiere?: boolean;
  }) {
    const isAdded = added.has(r.tmdbId);
    const premiere = showPremiere ? premiereLabel(r.firstAirDate) : null;
    return (
      <Link
        href={`/shows/${r.tmdbId}`}
        className="group block transition-transform active:scale-95 md:hover:scale-105"
      >
        <div className="relative overflow-hidden rounded-lg bg-surface shadow-md">
          <div className="aspect-[2/3] w-full">
            {r.posterPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://image.tmdb.org/t/p/w342${r.posterPath}`}
                alt={r.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <PosterPlaceholder name={r.name} />
            )}
          </div>
          <button
            onClick={(e) => handleAdd(e, r.tmdbId)}
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

  function Grid({
    items,
    showPremiere,
  }: {
    items: TmdbSearchResult[];
    showPremiere?: boolean;
  }) {
    return (
      <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {items.map((r) => (
          <Card key={r.tmdbId} r={r} showPremiere={showPremiere} />
        ))}
      </div>
    );
  }

  const showDefault = results === null || query.trim() === "";

  return (
    <div>
      <form onSubmit={runSearch} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim() === "") setResults(null);
          }}
          placeholder="Search for a show to add…"
          className="w-full rounded-lg border border-border-app bg-surface px-4 py-3 text-foreground outline-none placeholder:text-muted focus:border-accent"
        />
        <button
          type="submit"
          disabled={searching}
          className="shrink-0 rounded-lg bg-accent px-5 font-semibold text-black disabled:opacity-50"
        >
          {searching ? "…" : "Search"}
        </button>
      </form>

      {!showDefault && (
        <div className="mt-6">
          {results!.length > 0 ? (
            <Grid items={results!} />
          ) : (
            <div className="rounded-xl border border-border-app bg-surface p-5 text-sm text-muted">
              No shows found.
            </div>
          )}
        </div>
      )}

      {showDefault && (
        <div className="mt-6 space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
                Coming soon
              </h2>
              <Grid items={upcoming} showPremiere />
            </section>
          )}
          {recommended.length > 0 && (
            <section>
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-accent">
                Recommended for you
              </h2>
              <p className="mb-3 text-xs text-muted">
                Based on the shows you watched most
              </p>
              <Grid items={recommended} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
