"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CastMember } from "@/lib/tmdb";
import PosterPlaceholder from "./PosterPlaceholder";

type Scope = "all" | number;

function profileUrl(path: string | null): string | null {
  return path ? `https://image.tmdb.org/t/p/w185${path}` : null;
}

/** Approximate how big a part the actor plays, from episode share. */
function roleLabel(episodeCount: number, total: number): string | null {
  if (!total || total <= 0 || episodeCount <= 0) return null;
  const share = episodeCount / total;
  if (share >= 0.6) return "Main cast";
  if (share >= 0.15) return "Recurring";
  return "Guest";
}

function descriptor(episodeCount: number, total: number): string {
  const label = roleLabel(episodeCount, total);
  const eps =
    episodeCount > 0
      ? `${episodeCount} ${episodeCount === 1 ? "episode" : "episodes"}`
      : "";
  return [label, eps].filter(Boolean).join(" · ");
}

function ActorPhoto({ member }: { member: CastMember }) {
  const photo = profileUrl(member.profilePath);
  return (
    <div className="aspect-[2/3] overflow-hidden rounded-lg bg-surface">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={member.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <PosterPlaceholder name={member.name} />
      )}
    </div>
  );
}

export default function CastSection({
  tvId,
  seasons,
  seasonEpisodeCounts,
  totalEpisodes,
  initialScope = "all",
  initialCast,
}: {
  tvId: number;
  seasons: number[];
  seasonEpisodeCounts: Record<number, number>;
  totalEpisodes: number;
  initialScope?: Scope;
  initialCast?: CastMember[];
}) {
  const [scope, setScope] = useState<Scope>(initialScope);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [cache, setCache] = useState<Record<string, CastMember[]>>(
    initialCast
      ? { [initialScope === "all" ? "all" : String(initialScope)]: initialCast }
      : {}
  );
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  function actorHref(personId: number): string {
    return `/shows/${tvId}/cast/${personId}`;
  }

  useEffect(() => {
    try {
      const v = localStorage.getItem("cast-view");
      if (v === "grid" || v === "list") setView(v);
    } catch {}
  }, []);

  const key = scope === "all" ? "all" : String(scope);

  useEffect(() => {
    if (cache[key] !== undefined) return;
    let cancelled = false;
    setLoadingKey(key);
    const qs = scope === "all" ? `tv=${tvId}` : `tv=${tvId}&season=${scope}`;
    fetch(`/api/cast?${qs}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled)
          setCache((prev) => ({ ...prev, [key]: d.cast ?? [] }));
      })
      .catch(() => {
        if (!cancelled) setCache((prev) => ({ ...prev, [key]: [] }));
      })
      .finally(() => {
        if (!cancelled) setLoadingKey(null);
      });
    return () => {
      cancelled = true;
    };
  }, [key, scope, tvId, cache]);

  function chooseView(v: "grid" | "list") {
    setView(v);
    try {
      localStorage.setItem("cast-view", v);
    } catch {}
  }

  const cast = cache[key];
  const total = scope === "all" ? totalEpisodes : seasonEpisodeCounts[scope] ?? 0;
  const loading = cast === undefined;

  return (
    <section id="cast" className="mt-10 scroll-mt-20">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Cast</h2>
        <div className="inline-flex gap-1 rounded-lg border border-border-app p-0.5">
          <button
            type="button"
            onClick={() => chooseView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            className={`rounded-md p-1.5 transition-colors ${
              view === "grid" ? "bg-accent text-black" : "text-muted"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => chooseView("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
            className={`rounded-md p-1.5 transition-colors ${
              view === "list" ? "bg-accent text-black" : "text-muted"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scope: whole show or one season */}
      {seasons.length > 0 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            onClick={() => setScope("all")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              scope === "all" ? "bg-accent text-black" : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            All seasons
          </button>
          {seasons.map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                scope === s ? "bg-accent text-black" : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              Season {s}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="py-6 text-center text-sm text-muted">Loading cast…</p>
      ) : cast.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          No cast information available.
        </p>
      ) : view === "grid" ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {cast.map((m) => (
            <Link
              key={m.id}
              href={actorHref(m.id)}
              className="group block transition-transform active:scale-95 md:hover:scale-105"
            >
              <ActorPhoto member={m} />
              <p className="mt-1 truncate text-xs font-semibold group-hover:text-accent">
                {m.character || m.name}
              </p>
              {m.character && (
                <p className="truncate text-[11px] text-muted">{m.name}</p>
              )}
              {descriptor(m.episodeCount, total) && (
                <p className="truncate text-[10px] text-muted">
                  {descriptor(m.episodeCount, total)}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {cast.map((m) => (
            <li key={m.id}>
              <Link
                href={actorHref(m.id)}
                className="group flex gap-3 rounded-lg bg-surface p-2 transition-colors hover:bg-surface-2"
              >
                <div className="w-16 shrink-0 sm:w-20">
                  <ActorPhoto member={m} />
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="truncate text-sm font-semibold group-hover:text-accent">
                    {m.character || m.name}
                  </p>
                  {m.character && (
                    <p className="truncate text-sm text-muted">
                      Played by {m.name}
                    </p>
                  )}
                  {descriptor(m.episodeCount, total) && (
                    <p className="mt-0.5 text-xs text-muted">
                      {descriptor(m.episodeCount, total)}
                    </p>
                  )}
                  <span className="mt-1 inline-block text-xs font-medium text-accent group-hover:underline">
                    View actor →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
