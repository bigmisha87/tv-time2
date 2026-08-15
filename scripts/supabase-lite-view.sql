-- TV Time 2 — trimmed read view for list screens.
-- Paste into the Supabase SQL Editor and press RUN. Safe to re-run.
--
-- Why: every list screen (Up Next, My Shows, Upcoming, Profile, Discover)
-- downloads every show document. Episode synopses are over half of that
-- payload and none of those screens display them, so they cross the wire
-- for nothing. This view serves the same documents with the per-episode
-- `overview` removed. The show detail page still reads the full `shows`
-- table, so nothing is lost where synopses are actually shown.
--
-- The app falls back to the full table on its own if this view is missing,
-- so running it is an optimisation, never a requirement.

create or replace view shows_lite as
select
  tmdb_id,
  jsonb_set(
    data,
    '{episodes}',
    coalesce(
      (
        select jsonb_agg(ep - 'overview' order by ord)
        from jsonb_array_elements(data -> 'episodes')
          with ordinality as t(ep, ord)
      ),
      '[]'::jsonb
    )
  ) as data
from shows;
