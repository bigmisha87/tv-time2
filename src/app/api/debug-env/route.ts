import { NextResponse } from "next/server";

// TEMPORARY diagnostic — reports env presence and a live TMDB call result
// from the server, without exposing secret values. Remove after debugging.
export async function GET() {
  const tmdb = process.env.TMDB_READ_TOKEN ?? "";
  const omdb = process.env.OMDB_API_KEY ?? "";

  let tmdbStatus: number | string = "not-run";
  let tmdbBody = "";
  try {
    const res = await fetch(
      "https://api.themoviedb.org/3/search/tv?query=breaking%20bad",
      { headers: { Authorization: `Bearer ${tmdb}` } }
    );
    tmdbStatus = res.status;
    tmdbBody = (await res.text()).slice(0, 200);
  } catch (e) {
    tmdbStatus = "fetch-threw";
    tmdbBody = String(e).slice(0, 200);
  }

  return NextResponse.json({
    tmdb_present: tmdb.length > 0,
    tmdb_len: tmdb.length,
    tmdb_starts: tmdb.slice(0, 6),
    tmdb_ends: tmdb.slice(-6),
    omdb_len: omdb.length,
    tmdb_call_status: tmdbStatus,
    tmdb_call_body: tmdbBody,
  });
}
