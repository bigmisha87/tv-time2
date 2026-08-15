export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import DiscoverListClient from "@/components/DiscoverListClient";
import {
  DISCOVER_LISTS,
  isDiscoverListSlug,
  type DiscoverListMeta,
} from "@/lib/discoverLists";
import { recommendationSeeds } from "@/lib/recommend";
import { getStore } from "@/lib/store";
import {
  discoverListPage,
  recommendationsFor,
  type TmdbSearchResult,
} from "@/lib/tmdb";

export default async function DiscoverListPage({
  params,
}: {
  params: Promise<{ list: string }>;
}) {
  const { list } = await params;
  if (!isDiscoverListSlug(list)) notFound();
  const meta: DiscoverListMeta = DISCOVER_LISTS[list];

  const store = await getStore();
  const shows = store?.shows ?? [];
  const followedIds = shows.filter((s) => s.followed).map((s) => s.tmdbId);

  let items: TmdbSearchResult[] = [];
  let initialPage = 1;
  let totalPages = 1;

  if (list === "recommended") {
    // Aggregated from your own watch history — returned in full, no paging.
    const excludeIds = new Set(shows.map((s) => s.tmdbId));
    items = await recommendationsFor(
      recommendationSeeds(shows),
      excludeIds,
      Infinity
    );
  } else {
    const data = await discoverListPage(list, 1);
    items = data.results;
    initialPage = data.page;
    totalPages = data.totalPages;
  }

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Discover", href: "/discover" }, { label: meta.title }]}
      />
      <h1 className="text-2xl font-bold">{meta.title}</h1>
      {meta.subtitle && (
        <p className="mt-1 text-sm text-muted">{meta.subtitle}</p>
      )}

      <div className="mt-6">
        <DiscoverListClient
          slug={meta.slug}
          existingIds={followedIds}
          initialItems={items}
          initialPage={initialPage}
          totalPages={totalPages}
          paginated={meta.paginated}
          premiere={meta.premiere}
        />
      </div>
    </div>
  );
}
