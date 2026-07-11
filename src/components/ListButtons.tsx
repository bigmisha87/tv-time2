"use client";

import { useState, useTransition } from "react";
import { toggleList } from "@/lib/actions";
import type { ShowList } from "@/lib/store";

const LISTS: { key: ShowList; label: string; on: string }[] = [
  { key: "watchlist", label: "+ Watchlist", on: "✓ On watchlist" },
  { key: "dropped", label: "Dropped", on: "✓ Dropped" },
];

export default function ListButtons({
  tmdbId,
  initial,
}: {
  tmdbId: number;
  initial: ShowList[];
}) {
  const [lists, setLists] = useState<Set<ShowList>>(new Set(initial));
  const [, startTransition] = useTransition();

  function toggle(list: ShowList) {
    const inList = !lists.has(list);
    setLists((prev) => {
      const next = new Set(prev);
      if (inList) next.add(list);
      else next.delete(list);
      return next;
    });
    startTransition(() => toggleList(tmdbId, list, inList));
  }

  return (
    <>
      {LISTS.map(({ key, label, on }) => {
        const active = lists.has(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-accent text-accent"
                : "border-border-app text-muted hover:text-foreground"
            }`}
          >
            {active ? on : label}
          </button>
        );
      })}
    </>
  );
}
