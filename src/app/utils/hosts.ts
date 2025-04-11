import fs from 'fs';
import readline from 'readline';

export async function parseHosts() {
  try {
    const caddyfilePath = 'Caddyfile';
    
    if (!fs.existsSync(caddyfilePath)) {
      console.error(`Caddyfile not found at ${caddyfilePath}`);
      return [];
    }
    
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
    
    return hosts;
  } catch (error) {
    console.error('Error parsing hosts:', error);
    return [];
  }
}