import { NextResponse } from 'next/server';
import { getCaddySyncSnapshot } from '../../../utils/caddySyncState';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getCaddySyncSnapshot());
}
