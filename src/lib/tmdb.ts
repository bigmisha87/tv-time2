import type { StoredEpisode, StoredShow } from "./store";

const token = process.env.TMDB_READ_TOKEN;

async function api(
  path: string,
  params: Record<string, string> = {},
  revalidateSeconds?: number
) {
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    ...(revalidateSeconds ? { next: { revalidate: revalidateSeconds } } : {}),
  });
  if (!res.ok) throw new Error(`TMDB ${res.status} for ${path}`);
  return res.json();
}

export interface TmdbSearchResult {
  tmdbId: number;
  name: string;
  year: string | null;
  overview: string;
  posterPath: string | null;
  firstAirDate?: string | null;
}

interface RawListResult {
  id: number;
  name: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  popularity?: number;
}

function toResult(r: RawListResult): TmdbSearchResult {
  return {
    tmdbId: r.id,
    name: r.name,
    year: r.first_air_date ? r.first_air_date.slice(0, 4) : null,
    overview: r.overview ?? "",
    posterPath: r.poster_path ?? null,
    firstAirDate: r.first_air_date ?? null,
  };
}

const DAY_SECONDS = 60 * 60 * 24;

/** Popular shows premiering in the next 90 days (cached for a day). */
export async function upcomingPremieres(): Promise<TmdbSearchResult[]> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const horizon = new Date(Date.now() + 90 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const data = await api(
      "/discover/tv",
      {
        "first_air_date.gte": today,
        "first_air_date.lte": horizon,
        sort_by: "popularity.desc",
        include_null_first_air_dates: "false",
        with_original_language: "en",
      },
      DAY_SECONDS
    );
    return ((data.results ?? []) as RawListResult[])
      .filter((r) => r.poster_path)
      .slice(0, 12)
      .map(toResult);
  } catch {
    return [];
  }
}

interface RawVideo {
  key: string;
  site: string;
  type: string;
  official?: boolean;
}

function pickTrailer(videos: RawVideo[] | undefined): string | null {
  const yt = (videos ?? []).filter((v) => v.site === "YouTube");
  return (
    yt.find((v) => v.type === "Trailer" && v.official)?.key ??
    yt.find((v) => v.type === "Trailer")?.key ??
    yt.find((v) => v.type === "Teaser")?.key ??
    null
  );
}

/** Main YouTube trailer for a show (cached for a day). */
export async function showTrailerKey(tvId: number): Promise<string | null> {
  try {
    const data = await api(`/tv/${tvId}/videos`, {}, DAY_SECONDS);
    return pickTrailer(data.results);
  } catch {
    return null;
  }
}

/** YouTube trailer for a specific season (cached for a day). */
export async function seasonTrailerKey(
  tvId: number,
  season: number
): Promise<string | null> {
  try {
    const data = await api(`/tv/${tvId}/season/${season}/videos`, {}, DAY_SECONDS);
    return pickTrailer(data.results);
  } catch {
    return null;
  }
}

export interface ShowPreview {
  tmdbId: number;
  name: string;
  year: string | null;
  overview: string;
  posterPath: string | null;
  genres: string[];
  status: string | null;
  seasonCount: number;
  tmdbRating: number | null;
  imdbId: string | null;
  trailerKey: string | null;
}

/** Details for a show that isn't in the local store yet (cached for a day). */
export async function fetchShowPreview(
  tmdbId: number
): Promise<ShowPreview | null> {
  try {
    const d = await api(
      `/tv/${tmdbId}`,
      { append_to_response: "videos,external_ids" },
      DAY_SECONDS
    );
    return {
      tmdbId: d.id,
      name: d.name,
      year: d.first_air_date ? d.first_air_date.slice(0, 4) : null,
      overview: d.overview ?? "",
      posterPath: d.poster_path ?? null,
      genres: (d.genres ?? []).map((g: { name: string }) => g.name),
      status: d.status ?? null,
      seasonCount: (d.seasons ?? []).filter(
        (s: { season_number: number }) => s.season_number > 0
      ).length,
      tmdbRating: d.vote_average
        ? Math.round(d.vote_average * 10) / 10
        : null,
      imdbId: d.external_ids?.imdb_id ?? null,
      trailerKey: pickTrailer(d.videos?.results),
    };
  } catch {
    return null;
  }
}

/**
 * Aggregated TMDB recommendations for the given seed shows.
 * Earlier seeds weigh more; shows already in `excludeIds` are dropped.
 */
export async function recommendationsFor(
  seedIds: number[],
  excludeIds: Set<number>
): Promise<TmdbSearchResult[]> {
  const scores = new Map<number, { score: number; result: TmdbSearchResult }>();
  const lists = await Promise.all(
    seedIds.map((id) =>
      api(`/tv/${id}/recommendations`, {}, DAY_SECONDS).catch(() => null)
    )
  );
  lists.forEach((data, i) => {
    const weight = seedIds.length - i;
    for (const r of (data?.results ?? []) as RawListResult[]) {
      if (excludeIds.has(r.id) || !r.poster_path) continue;
      const entry = scores.get(r.id) ?? { score: 0, result: toResult(r) };
      entry.score += weight;
      scores.set(r.id, entry);
    }
  });
  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 18)
    .map((e) => e.result);
}

export async function searchTv(query: string): Promise<TmdbSearchResult[]> {
  if (!query.trim()) return [];
  const data = await api("/search/tv", { query });
  interface RawResult {
    id: number;
    name: string;
    first_air_date?: string;
    overview?: string;
    poster_path?: string | null;
  }
  return ((data.results ?? []) as RawResult[]).slice(0, 20).map((r) => ({
    tmdbId: r.id,
    name: r.name,
    year: r.first_air_date ? r.first_air_date.slice(0, 4) : null,
    overview: r.overview ?? "",
    posterPath: r.poster_path ?? null,
  }));
}

/** Fetch full show details + every episode of every season (specials excluded). */
export async function fetchFullShow(tmdbId: number): Promise<StoredShow> {
  const details = await api(`/tv/${tmdbId}`, {
    append_to_response: "external_ids",
  });
  const episodes: StoredEpisode[] = [];
  const seasonNumbers: number[] = (details.seasons ?? [])
    .map((s: { season_number: number }) => s.season_number)
    .filter((n: number) => n > 0);
  for (const n of seasonNumbers) {
    const season = await api(`/tv/${tmdbId}/season/${n}`);
    interface RawEpisode {
      season_number: number;
      episode_number: number;
      name?: string;
      air_date?: string;
      overview?: string;
      runtime?: number;
      vote_average?: number;
    }
    for (const ep of (season.episodes ?? []) as RawEpisode[]) {
      episodes.push({
        season: ep.season_number,
        episode: ep.episode_number,
        name: ep.name || `Episode ${ep.episode_number}`,
        airDate: ep.air_date || null,
        overview: ep.overview || "",
        runtime: ep.runtime ?? null,
        tmdbRating: ep.vote_average
          ? Math.round(ep.vote_average * 10) / 10
          : null,
        watched: false,
        watchedDate: null,
      });
    }
  }
  episodes.sort((a, b) => a.season - b.season || a.episode - b.episode);
  return {
    tmdbId: details.id,
    tvdbId: null,
    imdbId: details.external_ids?.imdb_id || null,
    name: details.name,
    posterPath: details.poster_path || null,
    backdropPath: details.backdrop_path || null,
    tmdbStatus: details.status || null,
    followed: true,
    favorited: false,
    episodes,
  };
}
