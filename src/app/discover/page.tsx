export const dynamic = "force-dynamic";

import DiscoverClient, {
  type DiscoverSection,
} from "@/components/DiscoverClient";
import { getStore } from "@/lib/store";
import { recommendationSeeds } from "@/lib/recommend";
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
  const seeds = recommendationSeeds(shows);

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
      slug: "recommended",
      title: "Recommended for you",
      subtitle: "Based on the shows you watch and rate most",
      items: recommended,
    },
    { slug: "trending", title: "Trending now", items: trending },
    { slug: "upcoming", title: "Coming soon", premiere: true, items: upcoming },
    {
      slug: "acclaimed",
      title: "Critically acclaimed",
      subtitle: "Top-rated by a huge audience",
      items: acclaimed,
    },
    { slug: "top-rated", title: "Best of all time", items: topRated },
  ];

  return (
    <DiscoverClient
      existingIds={followedIds}
      sections={sections}
      genres={genres}
    />
  );
}
