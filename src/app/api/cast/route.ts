import { NextRequest, NextResponse } from "next/server";
import { seasonCast, showCast } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const tv = Number(req.nextUrl.searchParams.get("tv"));
  const seasonParam = req.nextUrl.searchParams.get("season");
  if (!tv) {
    return NextResponse.json({ cast: [] }, { status: 400 });
  }
  const cast =
    seasonParam === null
      ? await showCast(tv)
      : await seasonCast(tv, Number(seasonParam));
  return NextResponse.json({ cast });
}
