import { NextResponse } from "next/server";
import { syncCaddy } from "~/lib/caddy/caddySync";
import { buildCaddyStatusPayload } from "~/lib/ui/caddyStatusPayload";

export async function POST() {
  const result = await syncCaddy();
  return NextResponse.json({
    ok: true,
    retry: result,
    status: await buildCaddyStatusPayload(),
  });
}
