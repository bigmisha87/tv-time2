import { lastActivity, type StoredShow } from "./store";

/**
 * Pick the shows that best represent what someone likes, to seed TMDB's
 * recommendation engine. A show weighs more the more of it you've watched, and
 * is boosted by being a favorite, by recent activity, and by your star rating.
 * Returns up to 8 TMDB ids, strongest first. Shared by the Discover row and its
 * full "Recommended for you" page so both seed from the same shows.
 */
export function recommendationSeeds(shows: StoredShow[]): number[] {
  const yearAgo = new Date(Date.now() - 365 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return shows
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
}
