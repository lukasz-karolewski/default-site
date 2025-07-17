import { NextRequest, NextResponse } from 'next/server';
import { getRedirectById, updateRedirect, deleteRedirect } from '../../../lib/database';
import { regenerateCaddyfile } from '../../../lib/caddyfile';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const redirect = getRedirectById(id);
    if (!redirect) {
      return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
    }

    return NextResponse.json(redirect);
  } catch (error) {
    console.error('Error fetching redirect:', error);
    return NextResponse.json({ error: 'Failed to fetch redirect' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, host, target } = body;

    const redirect = updateRedirect(id, { name, host, target });
    if (!redirect) {
      return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
    }

    // Regenerate Caddyfile with updated redirect
    await regenerateCaddyfile();

    return NextResponse.json(redirect);
  } catch (error) {
    console.error('Error updating redirect:', error);
    if ((error as Error).message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'A redirect with this name or host already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to update redirect' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const success = deleteRedirect(id);
    if (!success) {
      return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
    }

    // Regenerate Caddyfile without deleted redirect
    await regenerateCaddyfile();

    return NextResponse.json({ message: 'Redirect deleted successfully' });
  } catch (error) {
    console.error('Error deleting redirect:', error);
    return NextResponse.json({ error: 'Failed to delete redirect' }, { status: 500 });
  }
}