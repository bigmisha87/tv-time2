export const dynamic = "force-dynamic";

import DiscoverClient, {
  type DiscoverSection,
} from "@/components/DiscoverClient";
import { getStore, lastActivity } from "@/lib/store";
import {
  acclaimedShows,
  recommendationsFor,
  topRatedShows,
  trendingShows,
  tvGenres,
  upcomingPremieres,
} from "@/lib/tmdb";

export default async function DiscoverPage() {
  const store = await getStore();
  const shows = store?.shows ?? [];
  const followedIds = shows.filter((s) => s.followed).map((s) => s.tmdbId);
  const excludeIds = new Set(shows.map((s) => s.tmdbId));

  // Seed personalized recommendations by watch history, boosted by
  // favorites, recent activity, and the user's own star ratings.
  const yearAgo = new Date(Date.now() - 365 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const seeds = shows
    .map((s) => {
      const watched = s.episodes.filter((e) => e.watched).length;
      const ratingBoost = s.rating ? 0.5 + s.rating * 0.3 : 1;
      const weight =
        watched *
        (s.favorited ? 2 : 1) *
        (lastActivity(s) >= yearAgo ? 1.5 : 1) *
        ratingBoost;
      return { id: s.tmdbId, weight };
    })
    .filter((x) => x.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8)
    .map((x) => x.id);

  const [trending, acclaimed, topRated, recommended, upcoming, genres] =
    await Promise.all([
      trendingShows(),
      acclaimedShows(),
      topRatedShows(),
      recommendationsFor(seeds, excludeIds),
      upcomingPremieres(),
      tvGenres(),
    ]);

  const sections: DiscoverSection[] = [
    {
      title: "Recommended for you",
      subtitle: "Based on the shows you watch and rate most",
      items: recommended,
    },
    { title: "Trending now", items: trending },
    { title: "Coming soon", premiere: true, items: upcoming },
    {
      title: "Critically acclaimed",
      subtitle: "Top-rated by a huge audience",
      items: acclaimed,
    },
    { title: "Best of all time", items: topRated },
  ];

  return (
    <DiscoverClient
      existingIds={followedIds}
      sections={sections}
      genres={genres}
    />
  );
}
