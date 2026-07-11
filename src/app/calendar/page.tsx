export const dynamic = "force-dynamic";

import Link from "next/link";
import { getFollowedShows, posterUrl, today } from "@/lib/store";
import { setEpisodeWatched } from "@/lib/actions";
import PosterPlaceholder from "@/components/PosterPlaceholder";

interface UpcomingItem {
  date: string;
  showName: string;
  tmdbId: number;
  posterPath: string | null;
  season: number;
  episode: number;
  epName: string;
  watched: boolean;
  daysAway: number;
}

function dayDiff(from: string, to: string): number {
  return Math.round(
    (new Date(to + "T00:00:00Z").getTime() -
      new Date(from + "T00:00:00Z").getTime()) /
      86_400_000
  );
}

function groupLabel(item: UpcomingItem): string {
  const d = item.daysAway;
  if (d < 0) return "Recently aired";
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d <= 6)
    return new Date(item.date + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "long",
    });
  return "Later";
}

export default async function UpcomingPage() {
  const t = today();
  const items: UpcomingItem[] = [];

  for (const show of await getFollowedShows()) {
    for (const ep of show.episodes) {
      if (!ep.airDate) continue;
      const daysAway = dayDiff(t, ep.airDate);
      if (daysAway < -7 || daysAway > 90) continue;
      if (daysAway < 0 && ep.watched) continue; // recently aired: only unwatched
      items.push({
        date: ep.airDate,
        showName: show.name,
        tmdbId: show.tmdbId,
        posterPath: show.posterPath,
        season: ep.season,
        episode: ep.episode,
        epName: ep.name,
        watched: ep.watched,
        daysAway,
      });
    }
  }
  items.sort((a, b) => a.date.localeCompare(b.date));

  const groups = new Map<string, UpcomingItem[]>();
  for (const item of items) {
    const label = groupLabel(item);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Upcoming</h1>

      {items.length === 0 && (
        <div className="rounded-xl border border-border-app bg-surface p-5">
          <p className="font-medium">Nothing scheduled.</p>
          <p className="mt-1 text-sm text-muted">
            No recent or upcoming episodes for the shows you follow.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {[...groups.entries()].map(([label, groupItems]) => (
          <section key={label}>
            <div className="mb-2 flex justify-center">
              <span className="rounded-full bg-surface-2 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
                {label}
              </span>
            </div>
            <ul className="space-y-2">
              {groupItems.map((item) => {
                const poster = posterUrl(item.posterPath, "w185");
                const code = `S${String(item.season).padStart(2, "0")} | E${String(item.episode).padStart(2, "0")}`;
                return (
                  <li
                    key={`${item.tmdbId}:${item.season}:${item.episode}`}
                    className="flex items-center gap-3 rounded-lg bg-surface p-2 pr-3"
                  >
                    <Link
                      href={`/shows/${item.tmdbId}`}
                      className="block w-12 shrink-0 overflow-hidden rounded"
                    >
                      <div className="aspect-[2/3]">
                        {poster ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={poster}
                            alt={item.showName}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <PosterPlaceholder name={item.showName} />
                        )}
                      </div>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/shows/${item.tmdbId}`}
                        className="inline-block max-w-full truncate rounded-full border border-border-app px-2.5 py-0.5 text-xs font-semibold"
                      >
                        {item.showName}
                      </Link>
                      <p className="mt-1 text-sm font-semibold">{code}</p>
                      <p className="truncate text-sm text-muted">
                        {item.epName}
                      </p>
                      {item.daysAway < 0 && (
                        <span className="mt-1 inline-block rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-black">
                          NEW
                        </span>
                      )}
                    </div>
                    {item.daysAway < 0 ? (
                      <form
                        action={setEpisodeWatched.bind(
                          null,
                          item.tmdbId,
                          item.season,
                          item.episode,
                          true
                        )}
                      >
                        <button
                          type="submit"
                          aria-label={`Mark ${item.showName} ${code} watched`}
                          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border-app text-muted transition-colors hover:border-accent hover:text-accent"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            className="h-5 w-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m4.5 12.75 6 6 9-13.5"
                            />
                          </svg>
                        </button>
                      </form>
                    ) : item.daysAway > 6 ? (
                      <div className="shrink-0 text-right">
                        <p className="text-2xl font-bold leading-none">
                          {item.daysAway}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                          days
                        </p>
                      </div>
                    ) : (
                      <span className="shrink-0 text-xs text-muted">
                        {item.date.slice(8, 10)}/{item.date.slice(5, 7)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
