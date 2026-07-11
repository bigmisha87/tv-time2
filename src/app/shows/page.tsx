export const dynamic = "force-dynamic";

import ShowCard from "@/components/ShowCard";
import {
  airedUnwatchedCount,
  classifyShow,
  getFollowedShows,
  nextUpcomingEpisode,
  posterUrl,
  today,
  watchProgress,
  type ShowBucket,
  type StoredShow,
} from "@/lib/store";

function upcomingCaption(show: StoredShow): string | undefined {
  const ep = nextUpcomingEpisode(show);
  if (!ep || !ep.airDate) return undefined;
  const days = Math.round(
    (new Date(ep.airDate + "T00:00:00Z").getTime() -
      new Date(today() + "T00:00:00Z").getTime()) /
      86_400_000
  );
  const date = new Date(ep.airDate + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  return `${date} · ${days === 1 ? "tomorrow" : `in ${days} days`}`;
}

function ShowGrid({ shows }: { shows: StoredShow[] }) {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {shows.map((show) => (
        <ShowCard
          key={show.tmdbId}
          tmdbId={show.tmdbId}
          name={show.name}
          posterUrl={posterUrl(show.posterPath)}
          badge={airedUnwatchedCount(show)}
          progress={watchProgress(show)}
          caption={upcomingCaption(show)}
        />
      ))}
    </div>
  );
}

const SECTIONS: { bucket: ShowBucket; title: string }[] = [
  { bucket: "watching", title: "Watching" },
  { bucket: "stale", title: "Haven't watched in a while" },
  { bucket: "notStarted", title: "Haven't started" },
  { bucket: "finished", title: "Finished" },
];

export default function MyShowsPage() {
  const shows = getFollowedShows();

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">My Shows</h1>
        <span className="text-sm text-muted">{shows.length} shows</span>
      </div>
      <div className="space-y-8">
        {SECTIONS.map(({ bucket, title }) => {
          const group = shows.filter((s) => classifyShow(s) === bucket);
          if (group.length === 0) return null;
          return (
            <section key={bucket}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
                {title}
                <span className="ml-2 font-normal normal-case text-muted">
                  {group.length}
                </span>
              </h2>
              <ShowGrid shows={group} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
