"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addShow } from "@/lib/actions";
import type { TmdbSearchResult, TvGenre } from "@/lib/tmdb";
import DiscoverCard from "./DiscoverCard";

export interface DiscoverSection {
  title: string;
  subtitle?: string;
  premiere?: boolean;
  items: TmdbSearchResult[];
  /** When set, the row heading links to `/discover/[slug]` for the full list. */
  slug?: string;
}

function PosterGrid({
  items,
  added,
  onAdd,
}: {
  items: TmdbSearchResult[];
  added: Set<number>;
  onAdd: (e: React.MouseEvent, tmdbId: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {items.map((r) => (
        <DiscoverCard
          key={r.tmdbId}
          r={r}
          isAdded={added.has(r.tmdbId)}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
}

export default function DiscoverClient({
  existingIds,
  sections,
  genres,
}: {
  existingIds: number[];
  sections: DiscoverSection[];
  genres: TvGenre[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [added, setAdded] = useState<Set<number>>(new Set(existingIds));
  const [, startTransition] = useTransition();

  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const [genreItems, setGenreItems] = useState<TmdbSearchResult[]>([]);
  const [genreLoading, setGenreLoading] = useState(false);

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

  async function selectGenre(g: TvGenre) {
    if (activeGenre === g.id) {
      setActiveGenre(null);
      setGenreItems([]);
      return;
    }
    setActiveGenre(g.id);
    setGenreLoading(true);
    try {
      const res = await fetch(`/api/genre?id=${g.id}`);
      const data = await res.json();
      setGenreItems(data.results ?? []);
    } finally {
      setGenreLoading(false);
    }
  }

  function handleAdd(e: React.MouseEvent, tmdbId: number) {
    e.preventDefault();
    e.stopPropagation();
    setAdded((prev) => new Set(prev).add(tmdbId));
    startTransition(() => addShow(tmdbId));
  }

  const showDefault = results === null || query.trim() === "";

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Discover</h1>

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
            <PosterGrid items={results!} added={added} onAdd={handleAdd} />
          ) : (
            <div className="rounded-xl border border-border-app bg-surface p-5 text-sm text-muted">
              No shows found.
            </div>
          )}
        </div>
      )}

      {showDefault && (
        <div className="mt-6 space-y-8">
          {/* Browse by genre */}
          {genres.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
                Browse by genre
              </h2>
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => selectGenre(g)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      activeGenre === g.id
                        ? "border-accent bg-accent text-black"
                        : "border-border-app text-muted hover:text-foreground"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
              {activeGenre !== null && (
                <div className="mt-4">
                  {genreLoading ? (
                    <p className="text-sm text-muted">Loading…</p>
                  ) : genreItems.length > 0 ? (
                    <PosterGrid
                      items={genreItems}
                      added={added}
                      onAdd={handleAdd}
                    />
                  ) : (
                    <p className="text-sm text-muted">Nothing found.</p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Discovery rows */}
          {sections.map((section) => {
            if (section.items.length === 0) return null;
            const href = section.slug ? `/discover/${section.slug}` : null;
            return (
              <section key={section.title}>
                <div className="flex items-baseline justify-between gap-3">
                  {href ? (
                    <Link
                      href={href}
                      className="group text-sm font-semibold uppercase tracking-wide text-accent transition-opacity hover:opacity-80"
                    >
                      {section.title}
                      <span className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </Link>
                  ) : (
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-accent">
                      {section.title}
                    </h2>
                  )}
                  {href && (
                    <Link
                      href={href}
                      className="shrink-0 text-xs font-medium text-muted transition-colors hover:text-foreground"
                    >
                      See all
                    </Link>
                  )}
                </div>
                {section.subtitle && (
                  <p className="mb-3 text-xs text-muted">{section.subtitle}</p>
                )}
                <div
                  className={`flex gap-3 overflow-x-auto pb-2 ${
                    section.subtitle ? "" : "mt-3"
                  }`}
                >
                  {section.items.map((r) => (
                    <DiscoverCard
                      key={r.tmdbId}
                      r={r}
                      isAdded={added.has(r.tmdbId)}
                      onAdd={handleAdd}
                      width
                      showPremiere={section.premiere}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
