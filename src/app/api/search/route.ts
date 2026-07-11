import { NextRequest, NextResponse } from "next/server";
import { searchTv } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    const results = await searchTv(q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { results: [], error: "search_failed" },
      { status: 502 }
    );
  }
}
