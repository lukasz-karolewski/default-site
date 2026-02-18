import { NextRequest, NextResponse } from 'next/server';
import { addSite, getSites, removeSite, updateSite } from '../../utils/siteService';
import { applyCaddyConfig } from '../../utils/caddyApi';

export async function GET() {
  const sites = await getSites();
  return NextResponse.json(sites);
}

export async function POST(req: NextRequest) {
  const { host, upstream } = await req.json();
  await addSite(host, upstream);
  await applyCaddyConfig();
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const { id, host, upstream } = await req.json();
  await updateSite(id, host, upstream);
  await applyCaddyConfig();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await removeSite(id);
  await applyCaddyConfig();
  return NextResponse.json({ ok: true });
}
