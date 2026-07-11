export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import PosterPlaceholder from "@/components/PosterPlaceholder";
import SeasonList from "@/components/SeasonList";
import TrailerPlayer from "@/components/TrailerPlayer";
import StarRating from "@/components/StarRating";
import ListButtons from "@/components/ListButtons";
import { addShow, setFavorited, setFollowed } from "@/lib/actions";
import {
  averageRuntime,
  getShowById,
  hasAired,
  posterUrl,
  today,
} from "@/lib/store";
import { fetchShowPreview, showTrailerKey } from "@/lib/tmdb";

function Poster({
  src,
  name,
}: {
  src: string | null;
  name: string;
}) {
  return (
    <div className="w-28 shrink-0 overflow-hidden rounded-lg shadow-lg sm:w-36">
      <div className="aspect-[2/3]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <PosterPlaceholder name={name} />
        )}
      </div>
    </div>
  );
}

export default async function ShowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tmdbId = Number(id);
  const show = await getShowById(tmdbId);

  // ----- Preview mode: a show that isn't in the library yet -----
  if (!show) {
    const preview = await fetchShowPreview(tmdbId);
    if (!preview) notFound();

    return (
      <div>
        <Link
          href="/search"
          className="text-sm text-muted hover:text-foreground"
        >
          &larr; Search
        </Link>

        <div className="mt-4 flex gap-5">
          <Poster src={posterUrl(preview.posterPath, "w342")} name={preview.name} />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight">
              {preview.name}
              {preview.year && (
                <span className="font-normal text-muted"> ({preview.year})</span>
              )}
            </h1>
            {preview.genres.length > 0 && (
              <p className="mt-2 text-sm text-muted">
                {preview.genres.join(" · ")}
              </p>
            )}
            <p className="mt-1 text-sm text-muted">
              {preview.seasonCount}{" "}
              {preview.seasonCount === 1 ? "season" : "seasons"}
              {preview.status ? ` · ${preview.status}` : ""}
            </p>
            {preview.tmdbRating && (
              <p className="mt-1 text-sm">
                <span className="font-semibold text-accent">
                  ★ {preview.tmdbRating.toFixed(1)}
                </span>{" "}
                <span className="text-muted">TMDB</span>
              </p>
            )}
            <form action={addShow.bind(null, tmdbId)} className="mt-3">
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black"
              >
                + Add to My Shows
              </button>
            </form>
          </div>
        </div>

        {preview.overview && (
          <p className="mt-6 text-sm leading-relaxed text-muted">
            {preview.overview}
          </p>
        )}

        {preview.trailerKey && (
          <div className="mt-5">
            <TrailerPlayer videoKey={preview.trailerKey} label="Watch trailer" />
          </div>
        )}
      </div>
    );
  }

  // ----- Full mode: a show in the library -----
  const t = today();
  const aired = show.episodes.filter((e) => hasAired(e, t));
  const watched = show.episodes.filter((e) => e.watched).length;
  const poster = posterUrl(show.posterPath, "w342");
  const trailerKey = await showTrailerKey(show.tmdbId);

  return (
    <div>
      <Link href="/shows" className="text-sm text-muted hover:text-foreground">
        &larr; My Shows
      </Link>

      <div className="mt-4 flex gap-5">
        <Poster src={poster} name={show.name} />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight">{show.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {watched} / {aired.length} episodes watched
          </p>
          {averageRuntime(show) && (
            <p className="mt-1 text-sm text-muted">
              ≈ {averageRuntime(show)} min / episode
            </p>
          )}
          {show.imdbRating && (
            <p className="mt-1 text-sm">
              <span className="font-semibold text-accent">
                ★ {show.imdbRating.toFixed(1)}
              </span>{" "}
              <span className="text-muted">IMDb</span>
            </p>
          )}
          {show.tmdbStatus && (
            <p className="mt-1 text-sm text-muted">{show.tmdbStatus}</p>
          )}
          <div className="mt-3">
            <StarRating tmdbId={show.tmdbId} initial={show.rating ?? 0} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={setFavorited.bind(null, show.tmdbId, !show.favorited)}>
              <button
                type="submit"
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  show.favorited
                    ? "border-accent text-accent"
                    : "border-border-app text-muted hover:text-foreground"
                }`}
              >
                {show.favorited ? "★ Favorite" : "☆ Favorite"}
              </button>
            </form>
            <form action={setFollowed.bind(null, show.tmdbId, !show.followed)}>
              <button
                type="submit"
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  show.followed
                    ? "border-border-app text-muted hover:text-foreground"
                    : "border-accent text-accent"
                }`}
              >
                {show.followed ? "Following ✓" : "+ Follow"}
              </button>
            </form>
            {show.imdbId && (
              <a
                href={`https://www.imdb.com/title/${show.imdbId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border-app px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
              >
                IMDb ↗
              </a>
            )}
            <ListButtons tmdbId={show.tmdbId} initial={show.lists ?? []} />
          </div>
        </div>
      </div>

      {trailerKey && (
        <div className="mt-5">
          <TrailerPlayer videoKey={trailerKey} label="Watch trailer" />
        </div>
      )}

      <div className="mt-8">
        <SeasonList tmdbId={show.tmdbId} episodes={show.episodes} todayStr={t} />
      </div>
    </div>
  );
}
