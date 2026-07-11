export const dynamic = "force-dynamic";

import SearchClient from "@/components/SearchClient";
import { getStore, lastActivity } from "@/lib/store";
import { recommendationsFor, upcomingPremieres } from "@/lib/tmdb";

export default async function SearchPage() {
  const store = await getStore();
  const shows = store?.shows ?? [];
  const followedIds = shows.filter((s) => s.followed).map((s) => s.tmdbId);
  const excludeIds = new Set(shows.map((s) => s.tmdbId));

  // Seed the recommendations with the shows the user watched most,
  // boosting favorites and recent activity.
  const yearAgo = new Date(Date.now() - 365 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const seeds = shows
    .map((s) => {
      const watched = s.episodes.filter((e) => e.watched).length;
      const weight =
        watched *
        (s.favorited ? 2 : 1) *
        (lastActivity(s) >= yearAgo ? 1.5 : 1);
      return { id: s.tmdbId, weight };
    })
    .filter((x) => x.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8)
    .map((x) => x.id);

  const [upcoming, recommended] = await Promise.all([
    upcomingPremieres(),
    recommendationsFor(seeds, excludeIds),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Search</h1>
      <SearchClient
        existingIds={followedIds}
        upcoming={upcoming}
        recommended={recommended}
      />
    </div>
  );
}
