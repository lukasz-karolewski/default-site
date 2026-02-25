import { getSites } from './siteService';
import fs from 'fs/promises';
import { CADDY_ADMIN_ALLOWED_ORIGINS } from './caddyUrls';
import { getCaddyCustomFilePath, getCaddyfilePath } from './runtimePaths';

const REQUIRED_ADMIN_BLOCK = `    admin 0.0.0.0:2019 {
        origins ${CADDY_ADMIN_ALLOWED_ORIGINS.join(' ')}
    }`;

function matcherName(host: string, baseDomain: string): string {
  const suffix = '.' + baseDomain;
  return host.endsWith(suffix) ? host.slice(0, -suffix.length) : host;
}

export async function generateCaddyfile(): Promise<string> {
  const BASE_DOMAIN = process.env.BASE_DOMAIN;
  if (!BASE_DOMAIN) throw new Error('BASE_DOMAIN environment variable is required');
  const CADDY_CUSTOM_FILE = getCaddyCustomFilePath();
  const CADDYFILE_PATH = getCaddyfilePath();
  const DASHBOARD_UPSTREAM = process.env.DASHBOARD_UPSTREAM ?? 'localhost:3080';

  const sites = await getSites();
  const header = `# Managed by default-site — do not edit manually.\n# Use Caddyfile.custom for TLS, logging, and other options inside the site block.`;

  const siteBlocks = sites.map(s => {
    const name = matcherName(s.host, BASE_DOMAIN);
    return `\t@${name} host ${s.host}\n\thandle @${name} {\n\t\treverse_proxy ${s.upstream}\n\t}`;
  });

  const inner = [
    `\timport ${CADDY_CUSTOM_FILE}`,
    ...siteBlocks,
    `\thandle {\n\t\treverse_proxy ${DASHBOARD_UPSTREAM}\n\t}`,
  ].join('\n\n');

  let globalOptions = '';
  try {
    const existingCaddyfile = await fs.readFile(CADDYFILE_PATH, 'utf8');
    globalOptions = extractGlobalOptionsBlock(existingCaddyfile);
  } catch {
    // Existing file is optional; generate without global options when unavailable.
  }
  globalOptions = ensureAdminGlobalOptions(globalOptions);

  const managedBlock = `${header}\n\n*.${BASE_DOMAIN}, ${BASE_DOMAIN} {\n${inner}\n}\n`;
  return globalOptions ? `${globalOptions}\n\n${managedBlock}` : managedBlock;
}

function extractGlobalOptionsBlock(content: string): string {
  let i = 0;

  while (i < content.length) {
    // Skip whitespace.
    while (i < content.length && /\s/.test(content[i])) i++;

    // Skip line comments.
    if (content[i] === '#') {
      while (i < content.length && content[i] !== '\n') i++;
      continue;
    }
    break;
  }

  if (content[i] !== '{') return '';

  const start = i;
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (; i < content.length; i++) {
    const ch = content[i];

    if (quote) {
      if (ch === quote && content[i - 1] !== '\\') quote = null;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === '{') {
      depth++;
      continue;
    }

    if (ch === '}') {
      depth--;
      if (depth === 0) {
        return content.slice(start, i + 1).trim();
      }
    }
  }

  return '';
}

function ensureAdminGlobalOptions(globalOptions: string): string {
  const trimmed = globalOptions.trim();
  const body = trimmed ? trimmed.replace(/^\{\s*|\s*\}$/g, '') : '';

  // Replace any existing admin directive (single-line or block) with the required one.
  const withoutAdmin = body
    .replace(/^\s*admin\b[^\n{]*\{[\s\S]*?^\s*\}\s*$/gm, '')
    .replace(/^\s*admin\b[^\n]*$/gm, '')
    .trim();

  const pieces = withoutAdmin ? [withoutAdmin, REQUIRED_ADMIN_BLOCK] : [REQUIRED_ADMIN_BLOCK];
  return `{\n${pieces.join('\n\n')}\n}`;
}
