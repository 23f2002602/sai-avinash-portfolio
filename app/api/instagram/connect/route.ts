import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { beginConnection } from "@/lib/instagram";
import { isInstagramHandle } from "@/lib/instagram-types";

export const runtime = "nodejs";

function equalSecret(provided: unknown, expected: string | undefined): boolean {
  if (typeof provided !== "string" || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  let body: { secret?: unknown; handle?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!equalSecret(body.secret, process.env.INSTAGRAM_ADMIN_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isInstagramHandle(body.handle)) {
    return NextResponse.json({ error: "Select one of the two Instagram accounts" }, { status: 400 });
  }
  try {
    return NextResponse.json({ url: await beginConnection(body.handle) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Instagram connection is not configured yet" }, { status: 503 });
  }
}
