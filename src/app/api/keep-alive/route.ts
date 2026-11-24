import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// Never cached and never prerendered: every hit must reach Supabase, because
// the whole point is to prove to Supabase that the project is still in use.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// The free tier pauses a project after a week without "sufficient" database
// activity, and Supabase doesn't say what counts. On 23.11.2026 it paused the
// project although a read-only `count` (no rows returned) reached it every
// day. So each ping now does the work a real visit does, plus a write:
//   1. reads real rows from `shows`, like a page load;
//   2. writes the ping time into `keep_alive` (scripts/supabase-keep-alive.sql).
// Two schedulers call this, 12 hours apart, so one failing is not fatal:
// GitHub Actions (?from=github) and Vercel Cron (?from=vercel, vercel.json).
export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("from") ?? "manual";

  const read = await supabase
    .from("shows")
    .select("tmdb_id, updated_at")
    .order("updated_at", { ascending: false })
    .limit(25);

  if (read.error) {
    return NextResponse.json(
      { ok: false, step: "read", error: read.error.message },
      { status: 500 }
    );
  }

  const pingedAt = new Date().toISOString();
  const write = await supabase
    .from("keep_alive")
    .upsert({ id: 1, pinged_at: pingedAt, source });

  if (write.error) {
    return NextResponse.json(
      { ok: false, step: "write", error: write.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    rowsRead: read.data.length,
    wrote: pingedAt,
    source,
  });
}
