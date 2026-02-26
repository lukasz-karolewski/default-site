import { NextResponse } from 'next/server';
import { retryCaddyNow } from '../../../../utils/caddySyncScheduler';
import { buildCaddyStatusPayload } from '~/lib/caddyStatusPayload';

export async function POST() {
  const result = await retryCaddyNow();
  return NextResponse.json({
    ok: true,
    retry: result,
    status: await buildCaddyStatusPayload(),
  });
}
