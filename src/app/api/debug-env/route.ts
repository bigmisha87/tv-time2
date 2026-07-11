import { NextResponse } from "next/server";

// TEMPORARY diagnostic — reports whether env vars reach the server,
// without exposing their values. Remove after debugging.
export async function GET() {
  const tmdb = process.env.TMDB_READ_TOKEN ?? "";
  const omdb = process.env.OMDB_API_KEY ?? "";
  return NextResponse.json({
    tmdb_present: tmdb.length > 0,
    tmdb_len: tmdb.length,
    tmdb_starts: tmdb.slice(0, 6),
    omdb_present: omdb.length > 0,
    omdb_len: omdb.length,
    supabase_present: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").length > 0,
  });
}
