"use client";

import { useState } from "react";

export default function TrailerPlayer({
  videoKey,
  label,
}: {
  videoKey: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border-app px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
      >
        {open ? (
          "✕ Close trailer"
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972L6.917 19.333a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
            {label}
          </>
        )}
      </button>
      {open && (
        <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg">
          <iframe
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
            title={label}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>
      )}
    </div>
  );
}
