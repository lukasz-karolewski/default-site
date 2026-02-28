import { NextResponse } from "next/server";
import { retryCaddyNow } from "~/lib/caddy/caddySyncScheduler";
import { buildCaddyStatusPayload } from "~/lib/caddy/caddyStatusPayload";

export async function POST() {
	const result = await retryCaddyNow();
	return NextResponse.json({
		ok: true,
		retry: result,
		status: await buildCaddyStatusPayload(),
	});
}
