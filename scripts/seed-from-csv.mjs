// Converts docs/my_shows_export.csv (TV Time GDPR export, cleaned) into
// src/data/seed-shows.json used to seed the app's show list.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const csv = readFileSync(join(root, "docs", "my_shows_export.csv"), "utf8");

function parseCsvLine(line) {
  const fields = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { fields.push(cur); cur = ""; }
    else cur += ch;
  }
  fields.push(cur);
  return fields;
}

const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== "");
const header = parseCsvLine(lines[0]);
const shows = lines.slice(1).map((line) => {
  const row = Object.fromEntries(parseCsvLine(line).map((v, i) => [header[i], v]));
  return {
    tvdbId: Number(row.tv_show_id),
    name: row.tv_show_name,
    followed: row.is_followed === "1",
    favorited: row.is_favorited === "1",
    episodesSeen: Number(row.nb_episodes_seen) || 0,
    latestEpisodeId: row.latest_episode_id ? Number(row.latest_episode_id) : null,
    latestSeenDate: row.latest_seen_date || null,
  };
});

mkdirSync(join(root, "src", "data"), { recursive: true });
writeFileSync(
  join(root, "src", "data", "seed-shows.json"),
  JSON.stringify(shows, null, 2)
);
console.log(`Wrote ${shows.length} shows (${shows.filter((s) => s.followed).length} followed, ${shows.filter((s) => s.favorited).length} favorited)`);
