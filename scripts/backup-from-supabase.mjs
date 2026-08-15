#!/usr/bin/env node
// Pull every show back down from Supabase into a local backup file.
// The mirror image of migrate-to-supabase.mjs. Safe to run any time —
// it only reads from the cloud and never writes to it.
//
//   node scripts/backup-from-supabase.mjs
//
// Writes two files into data/backups/:
//   store-DD.MM.YYYY.json  — a dated snapshot, one per day
//   store-latest.json      — always the most recent run
import dotenv from "dotenv";
import { writeFileSync, mkdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

/** DD.MM.YYYY — the date format used everywhere in this project. */
function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

async function main() {
  // Supabase caps a plain select at 1000 rows, so page through explicitly.
  // The library is far smaller than that today, but this keeps the backup
  // honest if it ever grows past the cap.
  const PAGE = 500;
  const shows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("shows")
      .select("data")
      .order("tmdb_id")
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("Download failed:", error.message);
      process.exit(1);
    }
    shows.push(...data.map((row) => row.data));
    console.log(`  downloaded ${shows.length} shows...`);
    if (data.length < PAGE) break;
  }

  if (shows.length === 0) {
    // Never overwrite a good backup with an empty one — an outage or a wrong
    // key would otherwise silently destroy the safety net.
    console.error("Got 0 shows back. Refusing to write an empty backup.");
    process.exit(1);
  }

  const store = { syncedAt: new Date().toISOString().slice(0, 10), shows };
  const json = JSON.stringify(store, null, 2);

  const dir = join(root, "data/backups");
  mkdirSync(dir, { recursive: true });
  const dated = join(dir, `store-${stamp()}.json`);
  writeFileSync(dated, json);
  writeFileSync(join(dir, "store-latest.json"), json);

  const episodes = shows.reduce((n, s) => n + (s.episodes?.length ?? 0), 0);
  const watched = shows.reduce(
    (n, s) => n + (s.episodes?.filter((e) => e.watched).length ?? 0),
    0
  );
  const mb = (json.length / 1024 / 1024).toFixed(1);

  console.log(
    `\nBacked up ${shows.length} shows, ${episodes} episodes ` +
      `(${watched} marked watched), ${mb} MB.`
  );
  console.log(`Saved to ${dated}`);
}

main();
