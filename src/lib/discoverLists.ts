/**
 * Shared metadata for the Discover rows and their full-list pages.
 * The discover page, the `/discover/[list]` pages, and the pagination API all
 * read from here so slugs, titles, and subtitles never drift apart.
 */

export interface DiscoverListMeta {
  /** URL segment, e.g. `/discover/trending`. */
  slug: string;
  title: string;
  subtitle?: string;
  /** Show a premiere-date caption under each poster (for "Coming soon"). */
  premiere?: boolean;
  /**
   * Whether the underlying TMDB list can be paged through. "Recommended for
   * you" is aggregated from your own watch history and is fully returned at
   * once, so it has no further pages to load.
   */
  paginated: boolean;
}

export const DISCOVER_LISTS = {
  recommended: {
    slug: "recommended",
    title: "Recommended for you",
    subtitle: "Based on the shows you watch and rate most",
    paginated: false,
  },
  trending: {
    slug: "trending",
    title: "Trending now",
    paginated: true,
  },
  upcoming: {
    slug: "upcoming",
    title: "Coming soon",
    premiere: true,
    paginated: true,
  },
  acclaimed: {
    slug: "acclaimed",
    title: "Critically acclaimed",
    subtitle: "Top-rated by a huge audience",
    paginated: true,
  },
  "top-rated": {
    slug: "top-rated",
    title: "Best of all time",
    paginated: true,
  },
} satisfies Record<string, DiscoverListMeta>;

export type DiscoverListSlug = keyof typeof DISCOVER_LISTS;

/** Order the rows appear in on the Discover page. */
export const DISCOVER_LIST_ORDER: DiscoverListSlug[] = [
  "recommended",
  "trending",
  "upcoming",
  "acclaimed",
  "top-rated",
];

export function isDiscoverListSlug(value: string): value is DiscoverListSlug {
  return Object.prototype.hasOwnProperty.call(DISCOVER_LISTS, value);
}

/** The lists that can be paged through (everything except "recommended"). */
export type PaginatedDiscoverSlug = Exclude<DiscoverListSlug, "recommended">;

export function isPaginatedSlug(value: string): value is PaginatedDiscoverSlug {
  return isDiscoverListSlug(value) && DISCOVER_LISTS[value].paginated;
}
