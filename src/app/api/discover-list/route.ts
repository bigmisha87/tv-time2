import { NextRequest, NextResponse } from "next/server";
import { isPaginatedSlug } from "@/lib/discoverLists";
import { discoverListPage } from "@/lib/tmdb";

/** Serves one more page of a paginated Discover list for infinite scroll. */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");

  if (!isPaginatedSlug(slug)) {
    return NextResponse.json({ results: [], page: 1, totalPages: 1 });
  }

  try {
    const data = await discoverListPage(slug, page);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { results: [], page, totalPages: page, error: "list_failed" },
      { status: 502 }
    );
  }
}
