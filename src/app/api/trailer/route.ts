import { NextRequest, NextResponse } from "next/server";
import { seasonTrailerKey } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const tv = Number(req.nextUrl.searchParams.get("tv"));
  const season = Number(req.nextUrl.searchParams.get("season"));
  if (!tv || !season) {
    return NextResponse.json({ key: null }, { status: 400 });
  }
  const key = await seasonTrailerKey(tv, season);
  return NextResponse.json({ key });
}
