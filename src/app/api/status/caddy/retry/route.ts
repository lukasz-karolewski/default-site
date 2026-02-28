import { NextResponse } from "next/server";
import { retryCaddyNow } from "~/lib/caddy/caddyRetryLoop";
import { buildCaddyStatusPayload } from "~/lib/ui/caddyStatusPayload";

export async function POST() {
  const result = await retryCaddyNow();
  return NextResponse.json({
    ok: true,
    retry: result,
    status: await buildCaddyStatusPayload(),
  });
}
