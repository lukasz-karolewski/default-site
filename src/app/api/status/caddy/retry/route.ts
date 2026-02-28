import { NextResponse } from "next/server";
import { buildCaddyStatusPayload } from "~/lib/caddy/caddyStatusPayload";
import { retryCaddyNow } from "~/lib/caddy/caddySyncScheduler";

export async function POST() {
  const result = await retryCaddyNow();
  return NextResponse.json({
    ok: true,
    retry: result,
    status: await buildCaddyStatusPayload(),
  });
}
