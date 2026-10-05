import { NextResponse } from "next/server";
import { getReelsResponse } from "@/lib/instagram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const response = await getReelsResponse();
  return NextResponse.json(response, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=900, stale-while-revalidate=3600" },
  });
}
