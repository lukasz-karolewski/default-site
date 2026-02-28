import { NextResponse } from "next/server";
import { buildCaddyStatusPayload } from "~/lib/caddy/caddyBuildStatusPayload";
import { retryCaddyNow } from "~/lib/caddy/caddyRetryLoop";

export async function POST() {
  const result = await retryCaddyNow();
  return NextResponse.json({
    ok: true,
    retry: result,
    status: await buildCaddyStatusPayload(),
  });
}
