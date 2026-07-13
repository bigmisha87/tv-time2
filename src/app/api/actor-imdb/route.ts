import { NextRequest, NextResponse } from "next/server";
import { personImdbId } from "@/lib/tmdb";

/**
 * Redirect straight to an actor's IMDb page. We resolve the IMDb id lazily
 * (only when the user actually clicks) so opening a show doesn't cost one
 * TMDB call per cast member. Falls back to the actor's TMDB page.
 */
export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) {
    return NextResponse.redirect("https://www.imdb.com/");
  }
  const imdbId = await personImdbId(id);
  const url = imdbId
    ? `https://www.imdb.com/name/${imdbId}/`
    : `https://www.themoviedb.org/person/${id}`;
  return NextResponse.redirect(url);
}
