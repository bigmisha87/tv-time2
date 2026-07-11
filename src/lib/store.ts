import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface StoredEpisode {
  season: number;
  episode: number;
  name: string;
  airDate: string | null;
  overview: string;
  runtime?: number | null;
  tmdbRating: number | null;
  imdbRating?: number | null;
  imdbEpisodeId?: string;
  watched: boolean;
  watchedDate: string | null;
}

export interface StoredShow {
  tmdbId: number;
  tvdbId: number | null;
  imdbId: string | null;
  name: string;
  posterPath: string | null;
  backdropPath: string | null;
  tmdbStatus: string | null;
  imdbRating?: number | null;
  imdbVotes?: string | null;
  followed: boolean;
  favorited: boolean;
  addedAt?: string;
  episodes: StoredEpisode[];
}

export interface Store {
  syncedAt: string;
  shows: StoredShow[];
}

const storePath = join(process.cwd(), "data", "store.json");

export function getStore(): Store | null {
  if (!existsSync(storePath)) return null;
  return JSON.parse(readFileSync(storePath, "utf8")) as Store;
}

export function saveStore(store: Store): void {
  writeFileSync(storePath, JSON.stringify(store, null, 1));
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function hasAired(ep: StoredEpisode, todayStr = today()): boolean {
  return ep.airDate !== null && ep.airDate <= todayStr;
}

export function airedUnwatchedCount(show: StoredShow): number {
  const t = today();
  return show.episodes.filter((e) => hasAired(e, t) && !e.watched).length;
}

/** The next aired-but-unwatched episode, or null when fully caught up. */
export function nextUnwatched(show: StoredShow): StoredEpisode | null {
  const t = today();
  return show.episodes.find((e) => hasAired(e, t) && !e.watched) ?? null;
}

/** Most recent watched date across the show's episodes ("" when none). */
export function lastActivity(show: StoredShow): string {
  let max = "";
  for (const e of show.episodes) {
    if (e.watched && e.watchedDate && e.watchedDate > max) max = e.watchedDate;
  }
  return max;
}

export function getFollowedShows(): StoredShow[] {
  const store = getStore();
  if (!store) return [];
  return store.shows
    .filter((s) => s.followed)
    .sort(
      (a, b) =>
        lastActivity(b).localeCompare(lastActivity(a)) ||
        a.name.localeCompare(b.name)
    );
}

export type ShowBucket = "watching" | "stale" | "notStarted" | "finished";

const STALE_AFTER_MONTHS = 6;

/**
 * watching — has aired, unwatched episodes and recent activity;
 * stale — has aired, unwatched episodes but no activity for a long time;
 * notStarted — followed but no episode watched yet;
 * finished — caught up: nothing available to watch right now.
 *   (A show returns to "watching" automatically once a new episode airs.)
 */
export function classifyShow(show: StoredShow): ShowBucket {
  const unwatched = airedUnwatchedCount(show);
  const watchedAny = show.episodes.some((e) => e.watched);

  if (!watchedAny) return "notStarted";
  if (unwatched === 0) return "finished";

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - STALE_AFTER_MONTHS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const activity = lastActivity(show) || show.addedAt || "";
  return activity >= cutoffStr ? "watching" : "stale";
}

/** Watched share of aired episodes, as a 0–100 percentage. */
export function watchProgress(show: StoredShow): number {
  const t = today();
  const aired = show.episodes.filter((e) => hasAired(e, t));
  if (aired.length === 0) return 0;
  const watched = aired.filter((e) => e.watched).length;
  return Math.round((watched / aired.length) * 100);
}

/** The nearest future scheduled episode, or null. */
export function nextUpcomingEpisode(show: StoredShow): StoredEpisode | null {
  const t = today();
  let best: StoredEpisode | null = null;
  for (const ep of show.episodes) {
    if (ep.airDate && ep.airDate > t && (!best || ep.airDate < best.airDate!))
      best = ep;
  }
  return best;
}

/** Average runtime in minutes across episodes with a known runtime, or null. */
export function averageRuntime(show: StoredShow): number | null {
  const known = show.episodes.filter((e) => typeof e.runtime === "number");
  if (known.length === 0) return null;
  return Math.round(
    known.reduce((n, e) => n + (e.runtime as number), 0) / known.length
  );
}

const DEFAULT_RUNTIME_MIN = 40;

/** Total minutes of watched episodes (missing runtimes counted as 40 min). */
export function totalWatchedMinutes(shows: StoredShow[]): number {
  let minutes = 0;
  for (const show of shows) {
    for (const ep of show.episodes) {
      if (ep.watched) minutes += ep.runtime ?? DEFAULT_RUNTIME_MIN;
    }
  }
  return minutes;
}

export function getShowById(tmdbId: number): StoredShow | undefined {
  return getStore()?.shows.find((s) => s.tmdbId === tmdbId);
}

export function posterUrl(
  path: string | null,
  size: "w185" | "w342" | "w500" = "w342"
): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
