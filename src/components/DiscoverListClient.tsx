"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { addShow } from "@/lib/actions";
import type { TmdbSearchResult } from "@/lib/tmdb";
import DiscoverCard from "./DiscoverCard";

export default function DiscoverListClient({
  slug,
  existingIds,
  initialItems,
  initialPage,
  totalPages,
  paginated,
  premiere,
}: {
  slug: string;
  existingIds: number[];
  initialItems: TmdbSearchResult[];
  initialPage: number;
  totalPages: number;
  paginated: boolean;
  premiere?: boolean;
}) {
  const [items, setItems] = useState<TmdbSearchResult[]>(initialItems);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [added, setAdded] = useState<Set<number>>(new Set(existingIds));
  const [, startTransition] = useTransition();

  // Track seen ids so paging never shows the same show twice.
  const seen = useRef<Set<number>>(new Set(initialItems.map((r) => r.tmdbId)));
  const hasMore = paginated && page < totalPages && !failed;

  function handleAdd(e: React.MouseEvent, tmdbId: number) {
    e.preventDefault();
    e.stopPropagation();
    setAdded((prev) => new Set(prev).add(tmdbId));
    startTransition(() => addShow(tmdbId));
  }

  const loadMore = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const next = page + 1;
    try {
      const res = await fetch(
        `/api/discover-list?slug=${slug}&page=${next}`
      );
      if (!res.ok) throw new Error("bad status");
      const data = (await res.json()) as {
        results: TmdbSearchResult[];
        page: number;
        totalPages: number;
      };
      const fresh = (data.results ?? []).filter(
        (r) => !seen.current.has(r.tmdbId)
      );
      fresh.forEach((r) => seen.current.add(r.tmdbId));
      setItems((prev) => [...prev, ...fresh]);
      setPage(data.page ?? next);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [page, slug]);

  // Load the next page automatically as the sentinel scrolls into view.
  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-border-app bg-surface p-5 text-sm text-muted">
          Nothing to show here right now.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {items.map((r) => (
              <DiscoverCard
                key={r.tmdbId}
                r={r}
                isAdded={added.has(r.tmdbId)}
                onAdd={handleAdd}
                showPremiere={premiere}
              />
            ))}
          </div>

          {/* Infinite-scroll trigger + status */}
          <div ref={sentinel} className="h-1" />
          <div className="mt-6 flex justify-center">
            {loading && <p className="text-sm text-muted">Loading more…</p>}
            {failed && (
              <button
                type="button"
                onClick={loadMore}
                className="rounded-lg border border-border-app px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
              >
                Couldn&apos;t load more — try again
              </button>
            )}
            {!loading && !failed && !hasMore && (
              <p className="text-sm text-muted">
                {paginated ? "That's everything." : `${items.length} shows`}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
