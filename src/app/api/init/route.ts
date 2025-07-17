import { NextResponse } from 'next/server';
import { getAllRedirects } from '../../lib/database';
import { initializeDatabaseFromCaddyfile } from '../../lib/caddyfile';

export async function POST() {
  try {
    // Check if database is already initialized
    const existingRedirects = getAllRedirects();
    
    if (existingRedirects.length > 0) {
      return NextResponse.json({ 
        message: 'Database already initialized', 
        redirects: existingRedirects 
      });
    }

    // Initialize database from Caddyfile
    await initializeDatabaseFromCaddyfile();
    
    const redirects = getAllRedirects();
    
    return NextResponse.json({ 
      message: 'Database initialized successfully', 
      redirects 
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
  }
}