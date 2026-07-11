export const dynamic = "force-dynamic";

import Link from "next/link";
import ShowCard from "@/components/ShowCard";
import {
  airedUnwatchedCount,
  classifyShow,
  getFollowedShows,
  getStore,
  posterUrl,
  totalWatchedMinutes,
  watchProgress,
} from "@/lib/store";

export default async function ProfilePage() {
  const store = await getStore();
  const shows = store?.shows ?? [];
  const followed = await getFollowedShows();

  const episodesWatched = shows.reduce(
    (n, s) => n + s.episodes.filter((e) => e.watched).length,
    0
  );
  const minutes = totalWatchedMinutes(shows);
  const months = Math.floor(minutes / (60 * 24 * 30));
  const days = Math.floor((minutes % (60 * 24 * 30)) / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);

  const finished = followed.filter((s) => classifyShow(s) === "finished");
  const watching = followed.filter((s) => classifyShow(s) === "watching");
  const favorites = shows.filter((s) => s.favorited);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Profile</h1>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        Stats
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border-app bg-surface p-4">
          <p className="text-center text-sm font-medium text-muted">TV time</p>
          <div className="mt-3 flex justify-center gap-4">
            {[
              [months, "months"],
              [days, "days"],
              [hours, "hours"],
            ].map(([value, label]) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border-app bg-surface p-4">
          <p className="text-center text-sm font-medium text-muted">
            Episodes watched
          </p>
          <p className="mt-3 text-center text-3xl font-bold">
            {episodesWatched.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {[
          [watching.length, "watching"],
          [finished.length, "finished"],
          [followed.length, "total shows"],
        ].map(([value, label]) => (
          <div
            key={label}
            className="rounded-xl border border-border-app bg-surface p-3 text-center"
          >
            <p className="text-xl font-bold">{value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              {label}
            </p>
          </div>
        ))}
      </div>

      <Link
        href="/settings"
        className="mt-8 flex items-center justify-between rounded-xl border border-border-app bg-surface p-4 transition-colors hover:border-accent"
      >
        <div>
          <p className="text-sm font-medium">⚙ Settings</p>
          <p className="text-xs text-muted">Theme, new-episode alerts</p>
        </div>
        <span className="text-muted">→</span>
      </Link>

      {favorites.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            ❤️ Favorite shows
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {favorites.map((show) => (
              <ShowCard
                key={show.tmdbId}
                tmdbId={show.tmdbId}
                name={show.name}
                posterUrl={posterUrl(show.posterPath)}
                badge={airedUnwatchedCount(show)}
                progress={watchProgress(show)}
              />
            ))}
          </div>
        </section>
      )}

      {store && (
        <p className="mt-8 text-center text-xs text-muted">
          Show data last synced {store.syncedAt.slice(0, 10)} · data from TMDB
          &amp; OMDb
        </p>
      )}
    </div>
  );
}
