import { NextResponse } from 'next/server';
import { buildCaddyStatusPayload } from '~/lib/caddyStatusPayload';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await buildCaddyStatusPayload());
}
