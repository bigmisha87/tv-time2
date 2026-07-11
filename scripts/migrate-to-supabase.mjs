#!/usr/bin/env node
// Push every show from the local data/store.json up to Supabase as a
// full JSON document (one row per show). Safe to re-run; upserts by tmdb_id.
import dotenv from "dotenv";
import { readFileSync } from "node:fs";
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

async function main() {
  const store = JSON.parse(readFileSync(join(root, "data/store.json"), "utf-8"));
  console.log(`Uploading ${store.shows.length} shows...`);

  const rows = store.shows.map((show) => ({
    tmdb_id: show.tmdbId,
    data: show,
  }));

  // Upsert in batches so a single large request never times out.
  const BATCH = 50;
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("shows")
      .upsert(slice, { onConflict: "tmdb_id" });
    if (error) {
      console.error(`Batch starting at ${i} failed:`, error.message);
      process.exit(1);
    }
    done += slice.length;
    console.log(`  ${done}/${rows.length}`);
  }

  const episodes = store.shows.reduce((n, s) => n + (s.episodes?.length ?? 0), 0);
  console.log(`\nDone. ${done} shows and ${episodes} episodes are now in the cloud.`);
}

main();
