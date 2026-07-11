export const dynamic = "force-dynamic";

import {
  airedUnwatchedCount,
  getFollowedShows,
  lastActivity,
  nextUnwatched,
  posterUrl,
  watchProgress,
} from "@/lib/store";
import UpNextClient, { type UpNextItem } from "@/components/UpNextClient";

export default async function UpNextPage() {
  const items: UpNextItem[] = (await getFollowedShows())
    .map((show) => ({ show, next: nextUnwatched(show) }))
    .filter((x) => x.next !== null)
    .sort(
      (a, b) =>
        lastActivity(b.show).localeCompare(lastActivity(a.show)) ||
        a.show.name.localeCompare(b.show.name)
    )
    .map(({ show, next }) => {
      const ep = next!;
      return {
        tmdbId: show.tmdbId,
        name: show.name,
        poster: posterUrl(show.posterPath),
        code: `S${String(ep.season).padStart(2, "0")} | E${String(ep.episode).padStart(2, "0")}`,
        epName: ep.name,
        progress: watchProgress(show),
        remaining: airedUnwatchedCount(show),
      };
    });

  return <UpNextClient items={items} />;
}
