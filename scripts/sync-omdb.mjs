// Pulls IMDb ratings from OMDb into data/store.json.
// One request per season (not per episode) to stay within the free
// 1,000 requests/day quota, plus one request per show for the show rating.
// Re-runnable: skips shows that already have full rating coverage.
//
// Usage: node scripts/sync-omdb.mjs [--limit N]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const storePath = join(root, "data", "store.json");

const env = readFileSync(join(root, ".env.local"), "utf8");
const apiKey = env.match(/OMDB_API_KEY=(.+)/)?.[1]?.trim();
if (!apiKey) {
  console.error("OMDB_API_KEY missing from .env.local");
  process.exit(1);
}

const limitArg = process.argv.indexOf("--limit");
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const REQUEST_BUDGET = 900; // keep a safety margin under the 1,000/day cap
let requests = 0;
let budgetExhausted = false;

async function omdb(params) {
  if (requests >= REQUEST_BUDGET) {
    budgetExhausted = true;
    return null;
  }
  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  requests++;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 401) {
        // Daily limit reached mid-run.
        budgetExhausted = true;
        return null;
      }
      if (!res.ok) throw new Error(`OMDb ${res.status}`);
      return await res.json();
    } catch {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return null;
}

const store = JSON.parse(readFileSync(storePath, "utf8"));
const shows = store.shows.slice(0, limit);

let updatedEpisodes = 0;
let showsDone = 0;
const skipped = [];

async function processShow(show) {
  if (!show.imdbId) {
    skipped.push(`${show.name} (no IMDb id)`);
    return;
  }

  // Show-level rating (skip if we already have one from a previous run).
  if (show.imdbRating === undefined || show.imdbRating === null) {
    const d = await omdb({ i: show.imdbId });
    if (d?.imdbRating && d.imdbRating !== "N/A") {
      show.imdbRating = Number(d.imdbRating);
      show.imdbVotes = d.imdbVotes ?? null;
    } else if (d) {
      show.imdbRating = null;
    }
  }

  const seasons = [...new Set(show.episodes.map((e) => e.season))];
  for (const s of seasons) {
    const seasonEps = show.episodes.filter((e) => e.season === s);
    // Skip seasons already fully rated (makes re-runs cheap).
    if (seasonEps.every((e) => e.imdbRating !== undefined)) continue;

    const data = await omdb({ i: show.imdbId, Season: String(s) });
    if (!data || data.Response === "False") {
      for (const e of seasonEps)
        if (e.imdbRating === undefined) e.imdbRating = null;
      continue;
    }
    const byNumber = new Map(
      (data.Episodes ?? []).map((e) => [Number(e.Episode), e])
    );
    for (const ep of seasonEps) {
      const match = byNumber.get(ep.episode);
      if (match && match.imdbRating && match.imdbRating !== "N/A") {
        ep.imdbRating = Number(match.imdbRating);
        updatedEpisodes++;
      } else if (ep.imdbRating === undefined) {
        ep.imdbRating = null;
      }
      if (match?.imdbID) ep.imdbEpisodeId = match.imdbID;
    }
    if (budgetExhausted) return;
  }
  showsDone++;
  if (showsDone % 10 === 0)
    console.log(`…${showsDone} shows done (${requests} requests used)`);
}

const POOL = 4;
const queue = [...shows];
await Promise.all(
  Array.from({ length: POOL }, async () => {
    while (queue.length && !budgetExhausted) await processShow(queue.shift());
  })
);

writeFileSync(storePath, JSON.stringify(store, null, 1));

const rated = store.shows.reduce(
  (n, s) => n + s.episodes.filter((e) => typeof e.imdbRating === "number").length,
  0
);
const total = store.shows.reduce((n, s) => n + s.episodes.length, 0);
console.log(
  `\nDone: ${rated}/${total} episodes now have an IMDb rating (${requests} requests used).`
);
if (budgetExhausted)
  console.log(
    "NOTE: stopped at the daily request budget — run again tomorrow to fill the rest."
  );
if (skipped.length) {
  console.log(`\nSkipped (${skipped.length}):`);
  for (const s of skipped) console.log(`  - ${s}`);
}
