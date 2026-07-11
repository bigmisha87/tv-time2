-- TV Time 2 — cloud storage schema
-- Paste into Supabase SQL Editor and press RUN.
-- Each show is stored as one JSON document, so adding new fields
-- (ratings, lists, notifications) never needs another migration.

-- Remove the earlier column-per-field tables if they exist.
drop table if exists episodes;
drop table if exists shows;

create table shows (
  tmdb_id integer primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- Quick lookups of followed shows without loading every document twice.
create index if not exists idx_shows_followed
  on shows ((data ->> 'followed'));
