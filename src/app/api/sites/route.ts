import { NextResponse } from 'next/server';
import { getSites } from '../../utils/siteService';

export async function GET() {
  const sites = await getSites();
  return NextResponse.json(sites);
}
