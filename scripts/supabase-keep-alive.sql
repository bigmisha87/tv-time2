-- A one-row table the daily keep-alive ping writes to.
--
-- Supabase pauses a free project after a week without "sufficient" database
-- activity. On 23.11.2026 it paused this project even though a read-only
-- count query reached it every single day, so a read alone is not enough.
-- /api/keep-alive now also writes the time of each ping here: a real write
-- that Supabase cannot mistake for an idle project.
--
-- Run once in the Supabase SQL Editor. Safe to run again.

create table if not exists public.keep_alive (
  id int primary key,
  pinged_at timestamptz not null default now(),
  source text
);

-- Only the server (service-role key, which bypasses this) may touch it.
alter table public.keep_alive enable row level security;
