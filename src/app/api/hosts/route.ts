import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

export async function GET() {
  try {
    const caddyfilePath = path.join(process.cwd(), 'Caddyfile');
    const hosts: string[] = [];
    
    // Create a readline interface to read the file line by line
    const fileStream = fs.createReadStream(caddyfilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    // Regular expression to match lines starting with @ containing "host"
    const hostRegex = /^@(\w+)\s+.*host\s+([a-zA-Z0-9.-]+)/;
    
    // Process each line
    for await (const line of rl) {
      const match = line.match(hostRegex);
      if (match) {
        hosts.push(match[2]);
      }
    }
    
    return NextResponse.json({ hosts });
  } catch (error) {
    console.error('Error reading Caddyfile:', error);
    return NextResponse.json(
      { error: 'Failed to read Caddyfile' },
      { status: 500 }
    );
  }
}