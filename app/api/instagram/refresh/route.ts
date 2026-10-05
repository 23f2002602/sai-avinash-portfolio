import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { syncAccount } from "@/lib/instagram";
import { instagramAccounts } from "@/lib/instagram-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!secret || !supplied || Buffer.byteLength(secret) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(secret), Buffer.from(supplied))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await Promise.all(instagramAccounts.map(async (handle) => {
    try { return { handle, count: await syncAccount(handle), ok: true }; }
    catch { return { handle, ok: false }; }
  }));
  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
