/**
 * Poster and image URL helpers.
 *
 * Deliberately kept out of store.ts: these are used by browser components, and
 * store.ts pulls in the Supabase service-role client, which must never reach
 * the browser bundle. Pure string building only — safe on both sides.
 */

export function posterUrl(
  path: string | null,
  size: "w185" | "w342" | "w500" = "w342"
): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

/**
 * The same poster at every useful width, so the browser downloads the one that
 * fits the slot it's actually painted into. Without this a 48px thumbnail and
 * a full-width grid poster both pull the same file. Pair with a `sizes`
 * attribute describing the rendered width — see POSTER_GRID_SIZES.
 */
export function posterSrcSet(path: string | null): string | undefined {
  if (!path) return undefined;
  return ["w154", "w185", "w342", "w500"]
    .map((s) => `https://image.tmdb.org/t/p/${s}${path} ${s.slice(1)}w`)
    .join(", ");
}

/** Rendered poster width in the 3-to-6 column grids, per breakpoint. */
export const POSTER_GRID_SIZES =
  "(min-width: 1024px) 15vw, (min-width: 768px) 18vw, (min-width: 640px) 23vw, 31vw";
