# Personal Show Tracker — Project Brief for Claude Code

## Goal
A personal, mobile-friendly show/episode tracker to replace TV Time. Single user, no community features. Track every episode of every show: air date, watched/unwatched status, IMDb rating, synopsis, character names.

## Recommended stack (free / near-free)
- **Next.js** (App Router) — React framework, works great as a mobile web app, deploy free on Vercel
- **Supabase** — free-tier Postgres DB + auth (you only need auth for yourself, or skip it and password-protect the whole site)
- **TMDB API** — free, has full episode lists, air dates, cast/guest stars (character names), and often includes the linked IMDb ID
- **OMDb API** — free tier (1,000 requests/day) — use the IMDb ID from TMDB to pull the actual IMDb rating

Add to homescreen as a PWA (manifest.json + service worker) so it feels like a native app on your iPhone — no App Store, no cost.

## Data model
- `shows`: id, tmdb_id, imdb_id, name, poster_url, status (following/watching/dropped/favorite)
- `episodes`: id, show_id, season_number, episode_number, name, air_date, overview, imdb_rating, watched (bool), watched_date
- `characters` (optional, per episode): name, actor_name — pulled from TMDB guest_stars/credits

## Core screens (mirroring TV Time)
1. **My Shows** — grid/list of followed shows, poster + "X unwatched" badge
2. **Show detail** — season selector, episode list, tap to mark watched, episode synopsis + rating on expand
3. **Up Next** — feed of next unwatched episode across all your shows, sorted by air date
4. **Calendar/Upcoming** — episodes airing soon for shows you follow

## Your exported data
Your TV Time GDPR export did **not** include a full per-episode watch history — TV Time's export only gives:
- Your followed shows list (74 shows)
- Total episode count watched per show (108 shows)
- The single *latest* episode you marked watched per show

It does **not** list every individual episode you watched. So the seed import will set each show to "watched through" its latest known episode, not a full history. Going forward, all watch tracking will be exact.

See `my_shows_export.csv` — cleaned, merged from your export (show name, followed/favorited, total episodes seen, latest episode watched + date). Use this to seed the `shows` table and set each show's watched-through point when Claude Code scaffolds the DB.

## Suggested build order for Claude Code
1. Scaffold Next.js + Supabase project, deploy skeleton to Vercel
2. Build TMDB + OMDb fetch functions (search show → get episodes → get IMDb rating)
3. Import `my_shows_export.csv` to seed your shows list
4. Build My Shows + Show Detail screens with watched toggle
5. Build Up Next feed
6. Add to homescreen / PWA polish
