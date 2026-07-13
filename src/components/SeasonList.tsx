"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { markSeasonWatched, setEpisodeWatched } from "@/lib/actions";
import type { StoredEpisode } from "@/lib/store";
import TrailerPlayer from "./TrailerPlayer";

export default function SeasonList({
  tmdbId,
  episodes,
  todayStr,
}: {
  tmdbId: number;
  episodes: StoredEpisode[];
  todayStr: string;
}) {
  const seasons = useMemo(
    () => [...new Set(episodes.map((e) => e.season))].sort((a, b) => a - b),
    [episodes]
  );
  const firstUnwatched = episodes.find(
    (e) => e.airDate && e.airDate <= todayStr && !e.watched
  );
  const [season, setSeason] = useState(
    firstUnwatched?.season ?? seasons[seasons.length - 1] ?? 1
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [seasonTrailers, setSeasonTrailers] = useState<
    Record<number, string | null>
  >({});

  // Keep the selected season chip centered in the horizontal strip, so on an
  // advanced season you can see which one you're on without scrolling sideways.
  const chipRowRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement>(null);
  const didInitScroll = useRef(false);
  useEffect(() => {
    const row = chipRowRef.current;
    const chip = activeChipRef.current;
    if (!row || !chip) return;
    const delta =
      chip.offsetLeft - row.clientWidth / 2 + chip.clientWidth / 2 - row.scrollLeft;
    row.scrollBy({
      left: delta,
      behavior: didInitScroll.current ? "smooth" : "auto",
    });
    didInitScroll.current = true;
  }, [season]);

  useEffect(() => {
    if (seasonTrailers[season] !== undefined) return;
    let cancelled = false;
    fetch(`/api/trailer?tv=${tmdbId}&season=${season}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled)
          setSeasonTrailers((prev) => ({ ...prev, [season]: d.key ?? null }));
      })
      .catch(() => {
        if (!cancelled)
          setSeasonTrailers((prev) => ({ ...prev, [season]: null }));
      });
    return () => {
      cancelled = true;
    };
  }, [season, tmdbId, seasonTrailers]);

  const seasonEpisodes = episodes.filter((e) => e.season === season);
  const unwatchedAired = seasonEpisodes.filter(
    (e) => e.airDate && e.airDate <= todayStr && !e.watched
  ).length;

  return (
    <div className={isPending ? "opacity-60 transition-opacity" : ""}>
      {/* Season chips */}
      <div
        ref={chipRowRef}
        className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-2"
      >
        {seasons.map((s) => (
          <button
            key={s}
            ref={s === season ? activeChipRef : undefined}
            onClick={() => setSeason(s)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              s === season
                ? "bg-accent text-black"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            Season {s}
          </button>
        ))}
      </div>

      {seasonTrailers[season] && (
        <div className="mb-2 mt-1">
          <TrailerPlayer
            videoKey={seasonTrailers[season]!}
            label={`Season ${season} trailer`}
          />
        </div>
      )}

      {unwatchedAired > 1 && (
        <button
          onClick={() => startTransition(() => markSeasonWatched(tmdbId, season))}
          className="mb-2 mt-1 rounded-lg border border-border-app px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
        >
          ✓ Mark season {season} watched ({unwatchedAired})
        </button>
      )}

      <ul className="mt-2 space-y-1">
        {seasonEpisodes.map((ep) => {
          const key = `${ep.season}:${ep.episode}`;
          const aired = ep.airDate !== null && ep.airDate <= todayStr;
          const isOpen = expanded === key;
          return (
            <li key={key} className="rounded-lg bg-surface">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <button
                  onClick={() =>
                    startTransition(() =>
                      setEpisodeWatched(
                        tmdbId,
                        ep.season,
                        ep.episode,
                        !ep.watched
                      )
                    )
                  }
                  disabled={!aired && !ep.watched}
                  aria-label={`Toggle watched: episode ${ep.episode}`}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    ep.watched
                      ? "border-accent bg-accent text-black"
                      : aired
                        ? "border-border-app text-muted hover:border-accent hover:text-accent"
                        : "border-border-app/40 text-transparent"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${!aired ? "text-muted" : ""}`}>
                      {ep.episode}. {ep.name}
                    </p>
                    <p className="text-xs text-muted">
                      {ep.airDate ?? "TBA"}
                      {!aired && ep.airDate ? " · upcoming" : ""}
                      {ep.runtime ? ` · ${ep.runtime} min` : ""}
                      {ep.imdbRating
                        ? ` · ★ ${ep.imdbRating.toFixed(1)} IMDb`
                        : ep.tmdbRating
                          ? ` · ★ ${ep.tmdbRating.toFixed(1)}`
                          : ""}
                    </p>
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className={`h-4 w-4 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>
              {isOpen && (
                <div className="px-3 pb-3 pl-[60px]">
                  <p className="text-sm leading-relaxed text-muted">
                    {ep.overview || "No synopsis available."}
                  </p>
                  {ep.imdbEpisodeId && (
                    <a
                      href={`https://www.imdb.com/title/${ep.imdbEpisodeId}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
                    >
                      Rate on IMDb ↗
                    </a>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
