// One-time (re-runnable) sync: resolves every show in src/data/seed-shows.json
// against TMDB, downloads full episode lists, marks episodes watched according
// to the TV Time export counts, and writes everything to data/store.json.
//
// Re-running preserves watched flags already stored in data/store.json.
//
// Usage: node scripts/sync-tmdb.mjs [--limit N]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const storePath = join(root, "data", "store.json");

// --- token from .env.local ---
const env = readFileSync(join(root, ".env.local"), "utf8");
const token = env.match(/TMDB_READ_TOKEN=(.+)/)?.[1]?.trim();
if (!token) {
  console.error("TMDB_READ_TOKEN missing from .env.local");
  process.exit(1);
}

const limitArg = process.argv.indexOf("--limit");
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

async function api(path, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`TMDB ${res.status} for ${path}`);
    return res.json();
  }
  throw new Error(`TMDB rate-limited repeatedly for ${path}`);
}

/** Resolve a TV Time (TVDB) id to a TMDB show; falls back to name search. */
async function resolveShow(seedShow) {
  const found = await api(`/find/${seedShow.tvdbId}`, {
    external_source: "tvdb_id",
  });
  if (found.tv_results?.length) return found.tv_results[0];

  // Fallback: search by name, stripping a trailing "(2021)" year suffix.
  const m = seedShow.name.match(/^(.*?)\s*\((\d{4})\)\s*$/);
  const query = m ? m[1] : seedShow.name;
  const params = { query };
  if (m) params.first_air_date_year = m[2];
  const search = await api("/search/tv", params);
  return search.results?.[0] ?? null;
}

async function fetchFullShow(tmdbShow) {
  const details = await api(`/tv/${tmdbShow.id}`, {
    append_to_response: "external_ids",
  });
  const episodes = [];
  const seasonNumbers = (details.seasons ?? [])
    .map((s) => s.season_number)
    .filter((n) => n > 0); // skip "Specials"
  for (const n of seasonNumbers) {
    const season = await api(`/tv/${tmdbShow.id}/season/${n}`);
    for (const ep of season.episodes ?? []) {
      episodes.push({
        season: ep.season_number,
        episode: ep.episode_number,
        name: ep.name || `Episode ${ep.episode_number}`,
        airDate: ep.air_date || null,
        overview: ep.overview || "",
        runtime: ep.runtime ?? null,
        tmdbRating: ep.vote_average ? Math.round(ep.vote_average * 10) / 10 : null,
        watched: false,
        watchedDate: null,
      });
    }
  }
  episodes.sort((a, b) => a.season - b.season || a.episode - b.episode);
  return {
    tmdbId: details.id,
    imdbId: details.external_ids?.imdb_id || null,
    name: details.name,
    posterPath: details.poster_path || null,
    backdropPath: details.backdrop_path || null,
    tmdbStatus: details.status || null,
    episodes,
  };
}

const seed = JSON.parse(
  readFileSync(join(root, "src", "data", "seed-shows.json"), "utf8")
).slice(0, limit);

// Preserve watched state from a previous sync, if any.
const previous = existsSync(storePath)
  ? JSON.parse(readFileSync(storePath, "utf8"))
  : null;
const prevWatched = new Map();
const prevEpisodeExtras = new Map();
const prevShowExtras = new Map();
for (const show of previous?.shows ?? []) {
  prevShowExtras.set(show.tmdbId, {
    imdbRating: show.imdbRating,
    imdbVotes: show.imdbVotes,
  });
  for (const ep of show.episodes) {
    const key = `${show.tmdbId}:${ep.season}:${ep.episode}`;
    if (ep.watched) prevWatched.set(key, ep.watchedDate);
    if (ep.imdbRating !== undefined || ep.imdbEpisodeId !== undefined)
      prevEpisodeExtras.set(key, {
        imdbRating: ep.imdbRating,
        imdbEpisodeId: ep.imdbEpisodeId,
      });
  }
}

const results = [];
const unresolved = [];
let done = 0;

async function processSeedShow(seedShow) {
  try {
    const match = await resolveShow(seedShow);
    if (!match) {
      unresolved.push(seedShow.name);
      return;
    }
    const full = await fetchFullShow(match);
    const show = {
      ...full,
      tvdbId: seedShow.tvdbId,
      followed: seedShow.followed,
      favorited: seedShow.favorited,
    };
    if (previous) {
      // Re-sync: restore stored watched flags and IMDb ratings.
      Object.assign(show, prevShowExtras.get(show.tmdbId) ?? {});
      for (const ep of show.episodes) {
        const key = `${show.tmdbId}:${ep.season}:${ep.episode}`;
        if (prevWatched.has(key)) {
          ep.watched = true;
          ep.watchedDate = prevWatched.get(key);
        }
        Object.assign(ep, prevEpisodeExtras.get(key) ?? {});
      }
    } else {
      // First import: mark the first N episodes (air order) as watched,
      // matching the TV Time "episodes seen" count for this show.
      const watchedDate = seedShow.latestSeenDate
        ? seedShow.latestSeenDate.slice(0, 10)
        : null;
      for (let i = 0; i < Math.min(seedShow.episodesSeen, show.episodes.length); i++) {
        show.episodes[i].watched = true;
        show.episodes[i].watchedDate = watchedDate;
      }
    }
    results.push(show);
  } catch (err) {
    unresolved.push(`${seedShow.name} (error: ${err.message})`);
  } finally {
    done++;
    if (done % 10 === 0) console.log(`…${done}/${seed.length} shows processed`);
  }
}

// Small concurrency pool to stay well under TMDB rate limits.
const POOL = 6;
const queue = [...seed];
await Promise.all(
  Array.from({ length: POOL }, async () => {
    while (queue.length) await processSeedShow(queue.shift());
  })
);

// Dedupe in case two export rows resolved to the same TMDB show.
const byId = new Map();
for (const show of results) {
  const existing = byId.get(show.tmdbId);
  if (!existing) byId.set(show.tmdbId, show);
  else {
    const watchedCount = (s) => s.episodes.filter((e) => e.watched).length;
    if (watchedCount(show) > watchedCount(existing)) byId.set(show.tmdbId, show);
  }
}

// Keep shows that exist only in the previous store (added via the app,
// not present in the TV Time seed) — never drop them on re-sync.
for (const prev of previous?.shows ?? []) {
  if (!byId.has(prev.tmdbId)) byId.set(prev.tmdbId, prev);
}

const shows = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(
  storePath,
  JSON.stringify({ syncedAt: new Date().toISOString(), shows }, null, 1)
);

const epCount = shows.reduce((n, s) => n + s.episodes.length, 0);
const watchedCount = shows.reduce(
  (n, s) => n + s.episodes.filter((e) => e.watched).length,
  0
);
console.log(
  `\nDone: ${shows.length} shows, ${epCount} episodes (${watchedCount} marked watched).`
);
if (unresolved.length) {
  console.log(`\nUnresolved (${unresolved.length}):`);
  for (const name of unresolved) console.log(`  - ${name}`);
}
