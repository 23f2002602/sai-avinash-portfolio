import { NextResponse } from "next/server";
import { finishConnection } from "@/lib/instagram";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = new URL("/admin/instagram", url.origin);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || !code || url.searchParams.has("error")) {
    destination.searchParams.set("status", "cancelled");
    return NextResponse.redirect(destination);
  }
  try {
    const handle = await finishConnection(state, code);
    destination.searchParams.set("connected", handle);
  } catch {
    destination.searchParams.set("status", "failed");
  }
  return NextResponse.redirect(destination);
}
