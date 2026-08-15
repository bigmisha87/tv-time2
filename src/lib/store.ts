import { unstable_cache } from "next/cache";
import { cache } from "react";
import { supabase } from "./supabase";

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

/** A user's personal list membership for a show ("watchlist", "dropped", …). */
export type ShowList = "watchlist" | "dropped";

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
  /** User's own 1–5 star rating of the show (null = unrated). */
  rating?: number | null;
  /** Personal lists this show belongs to. */
  lists?: ShowList[];
  addedAt?: string;
  episodes: StoredEpisode[];
}

export interface Store {
  syncedAt: string;
  shows: StoredShow[];
}

/**
 * Cache tag covering every read of the library. Any write in actions.ts
 * invalidates it, so a change is visible on the very next page view.
 */
export const SHOWS_TAG = "shows";

/**
 * Every show is one row: { tmdb_id, data } where data is the full StoredShow.
 * Storing the whole object as one document means new fields (ratings, lists)
 * never require a database structure change.
 *
 * List screens never render episode synopses, but those synopses are over half
 * the bytes and push the library past Next's 2MB data-cache ceiling — meaning
 * the untrimmed library cannot be cached at all. So both read paths below drop
 * them. `shows_lite` (see scripts/supabase-lite-view.sql) drops them in the
 * database, which also halves the transfer; the fallback drops them here,
 * which at least restores caching.
 */
async function fetchLiteShows(): Promise<StoredShow[]> {
  const { data, error } = await supabase.from("shows_lite").select("data");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.data as StoredShow);
}

/**
 * Fallback for when the trimmed view hasn't been created. The synopses still
 * cross the wire, but dropping them here keeps the result under the 2MB cache
 * ceiling, so repeat page views are still spared a database round trip. Only
 * the show detail page renders synopses, and it reads full documents through
 * getShowById.
 */
async function fetchFullShowsTrimmed(): Promise<StoredShow[]> {
  const { data, error } = await supabase.from("shows").select("data");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const show = row.data as StoredShow;
    return {
      ...show,
      episodes: show.episodes.map((ep) => ({ ...ep, overview: "" })),
    };
  });
}

/**
 * Keeps the library between requests, so a page view only reaches the database
 * after something actually changed — every write in actions.ts expires the
 * tag. The time limit is a backstop for changes made outside the app, like the
 * sync scripts.
 */
const loadLiteShows = unstable_cache(fetchLiteShows, ["all-shows-lite"], {
  tags: [SHOWS_TAG],
  revalidate: 900,
});

const loadFullShows = unstable_cache(
  fetchFullShowsTrimmed,
  ["all-shows-full"],
  { tags: [SHOWS_TAG], revalidate: 900 }
);

/** Flipped off for good the first time the trimmed view turns out to be absent. */
let liteViewAvailable = true;

/**
 * React `cache` deduplicates within a single render: the Profile page asks for
 * the library twice, and without this it would fetch it twice.
 */
export const getAllShows = cache(async function getAllShows(): Promise<
  StoredShow[]
> {
  if (liteViewAvailable) {
    try {
      return await loadLiteShows();
    } catch (err) {
      liteViewAvailable = false;
      console.warn(
        `shows_lite view unavailable (${
          err instanceof Error ? err.message : err
        }); falling back to full documents. ` +
          `Run scripts/supabase-lite-view.sql to halve the transfer.`
      );
    }
  }

  try {
    return await loadFullShows();
  } catch (err) {
    console.error(
      `Supabase getAllShows failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
});

export async function getStore(): Promise<Store | null> {
  const shows = await getAllShows();
  return { shows, syncedAt: today() };
}

/** Persist one show back to the cloud (full-document upsert). */
export async function saveShow(show: StoredShow): Promise<void> {
  const { error } = await supabase.from("shows").upsert(
    { tmdb_id: show.tmdbId, data: show, updated_at: new Date().toISOString() },
    { onConflict: "tmdb_id" }
  );
  if (error) throw new Error(`Supabase saveShow failed: ${error.message}`);
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

export async function getFollowedShows(): Promise<StoredShow[]> {
  const shows = await getAllShows();
  return shows
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

/**
 * Reads the full `shows` table, not the trimmed view — the detail page is the
 * one screen that shows episode synopses. Deduplicated per render, but never
 * cached between requests: a server action re-reads this immediately after
 * writing, so a stale copy here would silently undo the change.
 */
export const getShowById = cache(async function getShowById(
  tmdbId: number
): Promise<StoredShow | undefined> {
  const { data, error } = await supabase
    .from("shows")
    .select("data")
    .eq("tmdb_id", tmdbId)
    .maybeSingle();
  if (error) {
    console.error("Supabase getShowById failed:", error.message);
    return undefined;
  }
  return (data?.data as StoredShow | undefined) ?? undefined;
});

// Image URL helpers live in ./images so browser components can use them
// without dragging the service-role Supabase client into the bundle.
// Re-exported here because server pages already import them from this module.
export { posterUrl, posterSrcSet, POSTER_GRID_SIZES } from "./images";
