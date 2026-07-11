"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PosterPlaceholder from "./PosterPlaceholder";

export interface UpNextItem {
  tmdbId: number;
  name: string;
  poster: string | null;
  code: string;
  epName: string;
  progress: number;
  remaining: number;
}

type View = "grid" | "list";
const STORAGE_KEY = "upnext-view";

export default function UpNextClient({ items }: { items: UpNextItem[] }) {
  const [view, setView] = useState<View>("grid");

  // Remember the user's choice across visits.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as View | null;
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  function choose(next: View) {
    setView(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Up Next</h1>
        <div className="flex gap-1 rounded-lg border border-border-app p-0.5">
          {(["grid", "list"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => choose(v)}
              aria-label={`${v} view`}
              className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
                view === v ? "bg-accent text-black" : "text-muted"
              }`}
            >
              {v === "grid" ? "▦ Grid" : "☰ List"}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 && (
        <div className="rounded-xl border border-border-app bg-surface p-5">
          <p className="font-medium">You&apos;re all caught up! 🎉</p>
        </div>
      )}

      {view === "grid" ? (
        <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {items.map((it) => (
            <Link
              key={it.tmdbId}
              href={`/shows/${it.tmdbId}`}
              className="group block transition-transform active:scale-95 md:hover:scale-105"
            >
              <div className="relative overflow-hidden rounded-lg bg-surface shadow-md">
                <div className="aspect-[2/3] w-full">
                  {it.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.poster}
                      alt={it.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PosterPlaceholder name={it.name} />
                  )}
                </div>
                <div className="h-1 w-full bg-black/60">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${it.progress}%` }}
                  />
                </div>
                {it.remaining > 0 && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-badge px-2 py-0.5 text-xs font-bold text-white shadow">
                    {it.remaining}
                  </span>
                )}
              </div>
              <p className="mt-1.5 truncate text-sm font-semibold">{it.name}</p>
              <p className="truncate text-xs text-muted">
                {it.code} · {it.epName}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.tmdbId}>
              <Link
                href={`/shows/${it.tmdbId}`}
                className="flex items-center gap-3 rounded-lg bg-surface p-2 pr-3 transition-colors active:bg-surface-2 md:hover:bg-surface-2"
              >
                <div className="relative w-12 shrink-0 overflow-hidden rounded">
                  <div className="aspect-[2/3]">
                    {it.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.poster}
                        alt={it.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <PosterPlaceholder name={it.name} />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{it.name}</p>
                  <p className="truncate text-xs text-muted">
                    {it.code} · {it.epName}
                  </p>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded bg-black/40">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${it.progress}%` }}
                    />
                  </div>
                </div>
                {it.remaining > 0 && (
                  <span className="shrink-0 rounded-full bg-badge px-2 py-0.5 text-xs font-bold text-white">
                    {it.remaining}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
