import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Never cached and never prerendered: every hit must reach Supabase, because
// the whole point is to prove to Supabase that the project is still in use.
// The free tier pauses a project after 7 days without database activity, and a
// cached page render would not count as activity.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { count, error } = await supabase
    .from("shows")
    .select("tmdb_id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, shows: count ?? 0, at: new Date().toISOString() });
}
