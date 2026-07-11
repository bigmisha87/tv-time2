import { NextRequest, NextResponse } from "next/server";
import { showsByGenre } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ results: [] });
  try {
    const results = await showsByGenre(id);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { results: [], error: "genre_failed" },
      { status: 502 }
    );
  }
}
