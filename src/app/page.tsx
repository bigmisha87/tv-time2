export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  airedUnwatchedCount,
  getFollowedShows,
  lastActivity,
  nextUnwatched,
  posterUrl,
  watchProgress,
} from "@/lib/store";
import PosterPlaceholder from "@/components/PosterPlaceholder";

export default function UpNextPage() {
  const withNext = getFollowedShows()
    .map((show) => ({ show, next: nextUnwatched(show) }))
    .filter((x) => x.next !== null)
    .sort(
      (a, b) =>
        lastActivity(b.show).localeCompare(lastActivity(a.show)) ||
        a.show.name.localeCompare(b.show.name)
    );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Up Next</h1>

      {withNext.length === 0 && (
        <div className="rounded-xl border border-border-app bg-surface p-5">
          <p className="font-medium">You&apos;re all caught up! 🎉</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {withNext.map(({ show, next }) => {
          const ep = next!;
          const poster = posterUrl(show.posterPath);
          const code = `S${String(ep.season).padStart(2, "0")} | E${String(ep.episode).padStart(2, "0")}`;
          const remaining = airedUnwatchedCount(show);
          return (
            <Link
              key={show.tmdbId}
              href={`/shows/${show.tmdbId}`}
              className="group block transition-transform active:scale-95 md:hover:scale-105"
            >
              <div className="relative overflow-hidden rounded-lg bg-surface shadow-md">
                <div className="aspect-[2/3] w-full">
                  {poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={poster}
                      alt={show.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PosterPlaceholder name={show.name} />
                  )}
                </div>
                <div className="h-1 w-full bg-black/60">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${watchProgress(show)}%` }}
                  />
                </div>
                {remaining > 0 && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-badge px-2 py-0.5 text-xs font-bold text-white shadow">
                    {remaining}
                  </span>
                )}
              </div>
              <p className="mt-1.5 truncate text-sm font-semibold">
                {show.name}
              </p>
              <p className="truncate text-xs text-muted">
                {code} · {ep.name}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
