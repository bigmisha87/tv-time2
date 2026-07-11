"use client";

import { useState, useTransition } from "react";
import { setRating } from "@/lib/actions";

export default function StarRating({
  tmdbId,
  initial,
}: {
  tmdbId: number;
  initial: number;
}) {
  const [rating, setRatingState] = useState(initial);
  const [hover, setHover] = useState(0);
  const [pending, startTransition] = useTransition();

  function choose(value: number) {
    // Clicking the current rating again clears it.
    const next = value === rating ? 0 : value;
    setRatingState(next);
    startTransition(() => setRating(tmdbId, next));
  }

  const display = hover || rating;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          disabled={pending}
          onMouseEnter={() => setHover(v)}
          onMouseLeave={() => setHover(0)}
          onClick={() => choose(v)}
          aria-label={`Rate ${v} star${v === 1 ? "" : "s"}`}
          className={`text-2xl leading-none transition-transform active:scale-90 ${
            v <= display ? "text-accent" : "text-muted/30"
          }`}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-xs text-muted">
        {rating > 0 ? `Your rating: ${rating}/5` : "Rate this show"}
      </span>
    </div>
  );
}
