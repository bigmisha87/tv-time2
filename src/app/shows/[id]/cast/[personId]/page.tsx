export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import PosterPlaceholder from "@/components/PosterPlaceholder";
import { fetchActorForShow } from "@/lib/tmdb";

function img(path: string, size: "w342" | "w500" | "w780"): string {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export default async function ActorPage({
  params,
}: {
  params: Promise<{ id: string; personId: string }>;
}) {
  const { id, personId } = await params;
  const tvId = Number(id);
  const actor = await fetchActorForShow(Number(personId), tvId);
  if (!actor) notFound();

  // Prefer a portrait taken from the show (period-accurate) over the actor's
  // current headshot, so they look the way they do in what you're watching.
  const periodPortrait = actor.showImages.find((im) => im.aspect < 1);
  const heroPath = periodPortrait?.filePath ?? actor.profilePath;

  const born = actor.birthday
    ? actor.birthday.split("-").reverse().join(".")
    : null;

  return (
    <div>
      <Link
        href={`/shows/${tvId}`}
        className="text-sm text-muted hover:text-foreground"
      >
        &larr; {actor.showName || "Back to show"}
      </Link>

      <div className="mt-4 flex gap-5">
        <div className="w-28 shrink-0 overflow-hidden rounded-lg shadow-lg sm:w-36">
          <div className="aspect-[2/3]">
            {heroPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img(heroPath, "w342")}
                alt={actor.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <PosterPlaceholder name={actor.name} />
            )}
          </div>
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight">{actor.name}</h1>
          {actor.character && (
            <p className="mt-1 text-lg font-semibold text-accent">
              as {actor.character}
            </p>
          )}
          {actor.totalEpisodes > 0 && (
            <p className="mt-2 text-sm text-muted">
              Appears in {actor.totalEpisodes}{" "}
              {actor.totalEpisodes === 1 ? "episode" : "episodes"}
              {actor.appearances.length > 0 &&
                ` across ${actor.appearances.length} ${
                  actor.appearances.length === 1 ? "season" : "seasons"
                }`}
            </p>
          )}
          {born && (
            <p className="mt-1 text-sm text-muted">
              Born {born}
              {actor.placeOfBirth ? ` · ${actor.placeOfBirth}` : ""}
            </p>
          )}
          {actor.imdbId && (
            <a
              href={`https://www.imdb.com/name/${actor.imdbId}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-lg border border-border-app px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
            >
              IMDb ↗
            </a>
          )}
        </div>
      </div>

      {/* Period images from this show */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          In {actor.showName}
        </h2>
        {actor.showImages.length > 0 ? (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {actor.showImages.map((im, i) => (
              <div
                key={i}
                className="h-40 shrink-0 overflow-hidden rounded-lg bg-surface shadow"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img(im.filePath, im.aspect < 1 ? "w342" : "w500")}
                  alt={`${actor.name} in ${actor.showName}`}
                  className="h-full w-auto object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-border-app bg-surface p-4 text-sm text-muted">
            No in-show images available for this actor yet.
          </p>
        )}
      </section>

      {/* Per-season appearances */}
      {actor.appearances.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Appearances by season
          </h2>
          <div className="flex flex-wrap gap-2">
            {actor.appearances.map((a) => (
              <span
                key={a.season}
                className="rounded-full bg-surface px-3 py-1.5 text-sm font-medium"
              >
                Season {a.season}
                <span className="text-muted">
                  {" "}
                  · {a.episodeCount} {a.episodeCount === 1 ? "ep" : "eps"}
                </span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Actor biography (TMDB has no character-level summary) */}
      {actor.biography && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            About {actor.name}
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
            {actor.biography}
          </p>
        </section>
      )}
    </div>
  );
}
