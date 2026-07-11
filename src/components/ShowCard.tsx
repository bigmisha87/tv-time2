import Link from "next/link";
import PosterPlaceholder from "./PosterPlaceholder";

export default function ShowCard({
  tmdbId,
  name,
  posterUrl,
  badge,
  progress,
  caption,
}: {
  tmdbId: number;
  name: string;
  posterUrl: string | null;
  badge?: number;
  progress?: number;
  caption?: string;
}) {
  return (
    <Link
      href={`/shows/${tmdbId}`}
      className="group block transition-transform active:scale-95 md:hover:scale-105"
    >
      <div className="relative overflow-hidden rounded-lg bg-surface shadow-md">
        <div className="aspect-[2/3] w-full">
          {posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl}
              alt={name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <PosterPlaceholder name={name} />
          )}
        </div>
        {progress !== undefined && (
          <div className="h-1 w-full bg-black/60">
            <div
              className="h-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {badge !== undefined && badge > 0 && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-badge px-2 py-0.5 text-xs font-bold text-white shadow">
            {badge}
          </span>
        )}
      </div>
      {caption && (
        <p className="mt-1 truncate text-center text-[11px] font-medium text-accent">
          {caption}
        </p>
      )}
    </Link>
  );
}
