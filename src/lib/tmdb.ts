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

/** Map a raw /discover or /trending list to English shows with posters. */
function toResultList(
  raw: RawListResult[],
  limit = 18
): TmdbSearchResult[] {
  return raw
    .filter((r) => r.poster_path)
    .slice(0, limit)
    .map(toResult);
}

/** Trending this week (cached for a day). */
export async function trendingShows(): Promise<TmdbSearchResult[]> {
  try {
    const data = await api(
      "/discover/tv",
      {
        sort_by: "popularity.desc",
        with_original_language: "en",
        "vote_count.gte": "50",
        "air_date.gte": new Date(Date.now() - 120 * 86_400_000)
          .toISOString()
          .slice(0, 10),
      },
      DAY_SECONDS
    );
    return toResultList((data.results ?? []) as RawListResult[]);
  } catch {
    return [];
  }
}

/** Highest-rated shows of all time with enough votes to be meaningful. */
export async function topRatedShows(): Promise<TmdbSearchResult[]> {
  try {
    const data = await api(
      "/discover/tv",
      {
        sort_by: "vote_average.desc",
        with_original_language: "en",
        "vote_count.gte": "1000",
      },
      DAY_SECONDS
    );
    return toResultList((data.results ?? []) as RawListResult[]);
  } catch {
    return [];
  }
}

/** Critically acclaimed: strong ratings from a very large audience. */
export async function acclaimedShows(): Promise<TmdbSearchResult[]> {
  try {
    const data = await api(
      "/discover/tv",
      {
        sort_by: "vote_count.desc",
        with_original_language: "en",
        "vote_average.gte": "8",
      },
      DAY_SECONDS
    );
    return toResultList((data.results ?? []) as RawListResult[]);
  } catch {
    return [];
  }
}

export interface TvGenre {
  id: number;
  name: string;
}

/** The list of TV genres (cached for a day). */
export async function tvGenres(): Promise<TvGenre[]> {
  try {
    const data = await api("/genre/tv/list", {}, DAY_SECONDS);
    return (data.genres ?? []) as TvGenre[];
  } catch {
    return [];
  }
}

/** Popular shows within one genre (cached for a day). */
export async function showsByGenre(
  genreId: number
): Promise<TmdbSearchResult[]> {
  try {
    const data = await api(
      "/discover/tv",
      {
        with_genres: String(genreId),
        sort_by: "popularity.desc",
        with_original_language: "en",
        "vote_count.gte": "100",
      },
      DAY_SECONDS
    );
    return toResultList((data.results ?? []) as RawListResult[], 20);
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

export interface CastMember {
  /** TMDB person id — used to resolve the actor's IMDb page on demand. */
  id: number;
  /** Actor's real name. */
  name: string;
  /** Character(s) they play (joined with " / " when more than one). */
  character: string;
  /** Profile photo path, or null when TMDB has none. */
  profilePath: string | null;
  /** Billing order (lower = more prominent). */
  order: number;
  /** Episodes the actor appears in, within the requested scope. */
  episodeCount: number;
}

interface RawAggregateCast {
  id: number;
  name: string;
  profile_path?: string | null;
  order?: number;
  total_episode_count?: number;
  roles?: { character?: string; episode_count?: number }[];
}

function toCast(raw: RawAggregateCast[] | undefined, limit: number): CastMember[] {
  return (raw ?? [])
    .map((c) => ({
      id: c.id,
      name: c.name,
      character:
        (c.roles ?? [])
          .map((r) => r.character?.trim())
          .filter(Boolean)
          .join(" / ") || "",
      profilePath: c.profile_path ?? null,
      order: c.order ?? 999,
      episodeCount:
        c.total_episode_count ??
        (c.roles ?? []).reduce((n, r) => n + (r.episode_count ?? 0), 0),
    }))
    .sort((a, b) => a.order - b.order)
    .slice(0, limit);
}

/** Full-series cast, aggregated across every season (cached for a day). */
export async function showCast(tvId: number): Promise<CastMember[]> {
  try {
    const data = await api(`/tv/${tvId}/aggregate_credits`, {}, DAY_SECONDS);
    return toCast(data.cast as RawAggregateCast[], 60);
  } catch {
    return [];
  }
}

/** Cast for a single season, with per-season episode counts (cached a day). */
export async function seasonCast(
  tvId: number,
  season: number
): Promise<CastMember[]> {
  try {
    const data = await api(
      `/tv/${tvId}/season/${season}/aggregate_credits`,
      {},
      DAY_SECONDS
    );
    return toCast(data.cast as RawAggregateCast[], 50);
  } catch {
    return [];
  }
}

export interface PersonImage {
  filePath: string;
  /** "poster" | "backdrop" | "still" — posters are usually portrait. */
  type: string;
  aspect: number;
}

export interface SeasonAppearance {
  season: number;
  episodeCount: number;
}

export interface ActorDetail {
  id: number;
  name: string;
  /** The actor's own biography (TMDB has no per-character summary). */
  biography: string;
  profilePath: string | null;
  birthday: string | null;
  placeOfBirth: string | null;
  imdbId: string | null;
  /** The character they play in THIS show. */
  character: string;
  /** Total episodes of this show they appear in. */
  totalEpisodes: number;
  /** Period-accurate images of the actor taken from this show. */
  showImages: PersonImage[];
  /** Per-season episode counts within this show. */
  appearances: SeasonAppearance[];
  showName: string;
}

interface RawTaggedImage {
  file_path?: string;
  image_type?: string;
  aspect_ratio?: number;
  media?: { media_type?: string; id?: number; show_id?: number };
}

/**
 * Everything the in-app actor page needs for one actor within one show:
 * their role, per-season appearances, period images from the show, and bio.
 * TMDB has no character biographies — only the actor's own bio.
 */
export async function fetchActorForShow(
  personId: number,
  tvId: number
): Promise<ActorDetail | null> {
  try {
    const [person, tagged, showDetails] = await Promise.all([
      api(`/person/${personId}`, {}, DAY_SECONDS),
      api(`/person/${personId}/tagged_images`, {}, DAY_SECONDS).catch(() => ({
        results: [],
      })),
      api(`/tv/${tvId}`, {}, DAY_SECONDS),
    ]);

    const seasonNums: number[] = (showDetails.seasons ?? [])
      .map((s: { season_number: number }) => s.season_number)
      .filter((n: number) => n > 0);

    const seasonCredits = await Promise.all(
      seasonNums.map((n) =>
        api(`/tv/${tvId}/season/${n}/aggregate_credits`, {}, DAY_SECONDS)
          .then((d) => ({ n, cast: (d.cast ?? []) as RawAggregateCast[] }))
          .catch(() => ({ n, cast: [] as RawAggregateCast[] }))
      )
    );

    const appearances: SeasonAppearance[] = [];
    let character = "";
    for (const { n, cast } of seasonCredits) {
      const c = cast.find((x) => x.id === personId);
      if (!c) continue;
      const ec =
        c.total_episode_count ??
        (c.roles ?? []).reduce((s, r) => s + (r.episode_count ?? 0), 0);
      if (ec > 0) appearances.push({ season: n, episodeCount: ec });
      if (!character) {
        character =
          (c.roles ?? [])
            .map((r) => r.character?.trim())
            .filter(Boolean)
            .join(" / ") || "";
      }
    }
    appearances.sort((a, b) => a.season - b.season);
    const totalEpisodes = appearances.reduce((s, a) => s + a.episodeCount, 0);

    const showImages: PersonImage[] = ((tagged.results ?? []) as RawTaggedImage[])
      .filter(
        (it) =>
          it.file_path &&
          it.media &&
          ((it.media.media_type === "tv" && it.media.id === tvId) ||
            (it.media.media_type === "tv_episode" && it.media.show_id === tvId))
      )
      .map((it) => ({
        filePath: it.file_path as string,
        type: it.image_type ?? "still",
        aspect: it.aspect_ratio ?? 1.78,
      }));

    return {
      id: person.id,
      name: person.name,
      biography: person.biography ?? "",
      profilePath: person.profile_path ?? null,
      birthday: person.birthday ?? null,
      placeOfBirth: person.place_of_birth ?? null,
      imdbId: person.imdb_id ?? null,
      character,
      totalEpisodes,
      showImages,
      appearances,
      showName: showDetails.name ?? "",
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
