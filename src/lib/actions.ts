"use server";

import { revalidatePath } from "next/cache";
import { getStore, saveStore, today } from "./store";
import { fetchFullShow } from "./tmdb";

function refresh() {
  revalidatePath("/", "layout");
}

export async function setEpisodeWatched(
  tmdbId: number,
  season: number,
  episode: number,
  watched: boolean
): Promise<void> {
  const store = getStore();
  if (!store) return;
  const show = store.shows.find((s) => s.tmdbId === tmdbId);
  const ep = show?.episodes.find(
    (e) => e.season === season && e.episode === episode
  );
  if (!ep) return;
  ep.watched = watched;
  ep.watchedDate = watched ? today() : null;
  saveStore(store);
  refresh();
}

export async function markSeasonWatched(
  tmdbId: number,
  season: number
): Promise<void> {
  const store = getStore();
  if (!store) return;
  const show = store.shows.find((s) => s.tmdbId === tmdbId);
  if (!show) return;
  const t = today();
  for (const ep of show.episodes) {
    if (ep.season === season && ep.airDate && ep.airDate <= t && !ep.watched) {
      ep.watched = true;
      ep.watchedDate = t;
    }
  }
  saveStore(store);
  refresh();
}

export async function addShow(tmdbId: number): Promise<void> {
  const store = getStore();
  if (!store) return;
  if (store.shows.some((s) => s.tmdbId === tmdbId)) {
    const existing = store.shows.find((s) => s.tmdbId === tmdbId)!;
    existing.followed = true;
  } else {
    const show = await fetchFullShow(tmdbId);
    show.addedAt = today();
    store.shows.push(show);
  }
  saveStore(store);
  refresh();
}

export async function setFollowed(
  tmdbId: number,
  followed: boolean
): Promise<void> {
  const store = getStore();
  if (!store) return;
  const show = store.shows.find((s) => s.tmdbId === tmdbId);
  if (!show) return;
  show.followed = followed;
  saveStore(store);
  refresh();
}

export async function setFavorited(
  tmdbId: number,
  favorited: boolean
): Promise<void> {
  const store = getStore();
  if (!store) return;
  const show = store.shows.find((s) => s.tmdbId === tmdbId);
  if (!show) return;
  show.favorited = favorited;
  saveStore(store);
  refresh();
}
