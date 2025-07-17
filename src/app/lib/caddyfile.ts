import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { Redirect, createRedirect, getAllRedirects } from './database';

const CADDYFILE_PATH = path.join(process.cwd(), 'Caddyfile');

export interface ParsedHost {
  name: string;
  host: string;
  target?: string;
}

export async function parseCaddyfile(): Promise<ParsedHost[]> {
  try {
    if (!fs.existsSync(CADDYFILE_PATH)) {
      console.error(`Caddyfile not found at ${CADDYFILE_PATH}`);
      return [];
    }
    
    const hosts: ParsedHost[] = [];
    
    // Create a readline interface to read the file line by line
    const fileStream = fs.createReadStream(CADDYFILE_PATH);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    // Regular expression to match lines starting with @ containing "host"
    const hostRegex = /^@(\w+)\s+.*host\s+([a-zA-Z0-9.-]+)/;
    
    // Keep track of current context for finding reverse_proxy targets
    let currentName: string | null = null;
    let currentHost: string | null = null;
    let insideHandleBlock = false;
    
    // Process each line
    for await (const line of rl) {
      const trimmedLine = line.trim();
      
      // Check for host directive
      const hostMatch = trimmedLine.match(hostRegex);
      if (hostMatch) {
        currentName = hostMatch[1];
        currentHost = hostMatch[2];
        hosts.push({
          name: currentName,
          host: currentHost,
        });
        continue;
      }
      
      // Check for handle block start
      if (currentName && trimmedLine.startsWith(`handle @${currentName}`)) {
        insideHandleBlock = true;
        continue;
      }
      
      // Check for reverse_proxy inside handle block
      if (insideHandleBlock && trimmedLine.startsWith('reverse_proxy ')) {
        const target = trimmedLine.replace('reverse_proxy ', '').trim();
        const hostEntry = hosts.find(h => h.name === currentName);
        if (hostEntry) {
          hostEntry.target = target;
        }
      }
      
      // Check for block end
      if (insideHandleBlock && trimmedLine === '}') {
        insideHandleBlock = false;
        currentName = null;
        currentHost = null;
      }
    }
    
    return hosts;
  } catch (error) {
    console.error('Error parsing Caddyfile:', error);
    return [];
  }
}

export async function initializeDatabaseFromCaddyfile(): Promise<void> {
  try {
    const parsedHosts = await parseCaddyfile();
    
    for (const host of parsedHosts) {
      try {
        await createRedirect({
          name: host.name,
          host: host.host,
          target: host.target || 'http://localhost:8080', // Default target if not found
        });
        console.log(`Added redirect: ${host.name} -> ${host.host} -> ${host.target}`);
      } catch {
        console.log(`Redirect ${host.name} already exists, skipping...`);
      }
    }
  } catch (error) {
    console.error('Error initializing database from Caddyfile:', error);
  }
}

export function generateCaddyfile(redirects: Redirect[]): string {
  let caddyfile = `# Generated Caddyfile
{
    # Use Route53 for DNS challenges with wildcard certificates
    acme_dns route53 {
        region us-east-1
    }
}

# Default site that shows all available services
:80, :443 {
    respond "Default site"
}

`;

  // Add each redirect as a handle block
  for (const redirect of redirects) {
    caddyfile += `# ${redirect.name}
@${redirect.name} host ${redirect.host}
handle @${redirect.name} {
    reverse_proxy ${redirect.target}
}

`;
  }

  return caddyfile;
}

export async function writeCaddyfile(redirects: Redirect[]): Promise<void> {
  const caddyfileContent = generateCaddyfile(redirects);
  fs.writeFileSync(CADDYFILE_PATH, caddyfileContent);
  console.log('Caddyfile updated successfully');
}

export async function regenerateCaddyfile(): Promise<void> {
  const redirects = getAllRedirects();
  await writeCaddyfile(redirects);
}