"use server";

import { revalidatePath, updateTag } from "next/cache";
import {
  getShowById,
  saveShow,
  today,
  SHOWS_TAG,
  type ShowList,
  type StoredShow,
} from "./store";
import { fetchFullShow } from "./tmdb";

/**
 * Called after every write. `updateTag` expires the cached library so the next
 * page view reads the change back from the database; `revalidatePath` throws
 * away the rendered pages built from the old copy. Both are needed — without
 * the tag, screens would keep rendering the previous state.
 *
 * `updateTag` rather than `revalidateTag`: the latter now serves stale content
 * while it refreshes in the background, so ticking an episode could still show
 * it unticked. `updateTag` makes the next read wait for fresh data, which is
 * what "read your own writes" requires. It only works inside Server Actions —
 * fine here, since every write in this app is one.
 */
function refresh() {
  updateTag(SHOWS_TAG);
  revalidatePath("/", "layout");
}

export async function setEpisodeWatched(
  tmdbId: number,
  season: number,
  episode: number,
  watched: boolean
): Promise<void> {
  const show = await getShowById(tmdbId);
  const ep = show?.episodes.find(
    (e) => e.season === season && e.episode === episode
  );
  if (!show || !ep) return;
  ep.watched = watched;
  ep.watchedDate = watched ? today() : null;
  await saveShow(show);
  refresh();
}

export async function markSeasonWatched(
  tmdbId: number,
  season: number
): Promise<void> {
  const show = await getShowById(tmdbId);
  if (!show) return;
  const t = today();
  for (const ep of show.episodes) {
    if (ep.season === season && ep.airDate && ep.airDate <= t && !ep.watched) {
      ep.watched = true;
      ep.watchedDate = t;
    }
  }
  await saveShow(show);
  refresh();
}

export async function addShow(tmdbId: number): Promise<void> {
  const existing = await getShowById(tmdbId);
  if (existing) {
    existing.followed = true;
    await saveShow(existing);
  } else {
    const show = await fetchFullShow(tmdbId);
    show.addedAt = today();
    show.followed = true;
    await saveShow(show);
  }
  refresh();
}

export async function setFollowed(
  tmdbId: number,
  followed: boolean
): Promise<void> {
  const show = await getShowById(tmdbId);
  if (!show) return;
  show.followed = followed;
  await saveShow(show);
  refresh();
}

export async function setFavorited(
  tmdbId: number,
  favorited: boolean
): Promise<void> {
  const show = await getShowById(tmdbId);
  if (!show) return;
  show.favorited = favorited;
  await saveShow(show);
  refresh();
}

/** Set the user's personal 1–5 star rating (0 clears it). */
export async function setRating(tmdbId: number, rating: number): Promise<void> {
  const show = await getShowById(tmdbId);
  if (!show) return;
  show.rating = rating > 0 ? rating : null;
  await saveShow(show);
  refresh();
}

/** Toggle membership of a show in one of the personal lists. */
export async function toggleList(
  tmdbId: number,
  list: ShowList,
  inList: boolean
): Promise<void> {
  const show = await getShowById(tmdbId);
  if (!show) return;
  const current = new Set<ShowList>(show.lists ?? []);
  if (inList) current.add(list);
  else current.delete(list);
  show.lists = [...current];
  await saveShow(show);
  refresh();
}
