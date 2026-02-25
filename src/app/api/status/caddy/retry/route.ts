import { NextResponse } from 'next/server';
import { retryCaddyNow } from '../../../../utils/caddySyncScheduler';
import { getCaddySyncSnapshot } from '../../../../utils/caddySyncState';

export async function POST() {
  const result = await retryCaddyNow();
  return NextResponse.json({
    ok: true,
    retry: result,
    status: getCaddySyncSnapshot(),
  });
}
