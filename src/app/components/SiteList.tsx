import SiteLink from './SiteLink';

// Modified for rebuild
async function getHosts() {
  // Direct server-side API call
  try {
    // Server components can directly access API functions
    const fs = require('fs');
    const path = require('path');
    const readline = require('readline');
    
    const caddyfilePath = path.join(process.cwd(), 'Caddyfile');
    const hosts: string[] = [];
    
    if (!fs.existsSync(caddyfilePath)) {
      console.error('Caddyfile not found at:', caddyfilePath);
      return [];
    }
    
    const fileStream = fs.createReadStream(caddyfilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    const hostRegex = /^@(\w+)\s+.*host\s+([a-zA-Z0-9.-]+)/;
    
    for await (const line of rl) {
      const match = line.match(hostRegex);
      if (match) {
        hosts.push(match[2]);
      }
    }
    
    return hosts;
  } catch (error) {
    console.error('Error reading Caddyfile:', error);
    return [];
  }
}

export default async function SiteList() {
  const sites = await getHosts();

  if (sites.length === 0) {
    return <div className="text-center">No sites found</div>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {sites.map((site: string) => (
        <SiteLink key={site} href={`https://${site}`} label={site} />
      ))}
    </div>
  );
}