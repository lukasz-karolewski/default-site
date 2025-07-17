import { NextRequest, NextResponse } from 'next/server';
import { getAllRedirects, createRedirect } from '../../lib/database';
import { regenerateCaddyfile } from '../../lib/caddyfile';

export async function GET() {
  try {
    const redirects = getAllRedirects();
    return NextResponse.json(redirects);
  } catch (error) {
    console.error('Error fetching redirects:', error);
    return NextResponse.json({ error: 'Failed to fetch redirects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, host, target } = body;

    if (!name || !host || !target) {
      return NextResponse.json(
        { error: 'Name, host, and target are required' },
        { status: 400 }
      );
    }

    const redirect = createRedirect({ name, host, target });
    
    // Regenerate Caddyfile with new redirect
    await regenerateCaddyfile();
    
    return NextResponse.json(redirect, { status: 201 });
  } catch (error) {
    console.error('Error creating redirect:', error);
    if ((error as Error).message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'A redirect with this name or host already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create redirect' }, { status: 500 });
  }
}