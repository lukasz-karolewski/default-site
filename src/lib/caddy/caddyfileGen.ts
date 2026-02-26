import { getSites } from '~/lib/data/siteService';
import fs from 'fs/promises';
import { CADDY_ADMIN_ALLOWED_ORIGINS } from '~/lib/caddy/caddyUrls';
import { getCaddyfilePath } from '~/lib/config/runtimePaths';
import { getSiteConfig } from '~/lib/data/siteConfig';

const REQUIRED_ADMIN_BLOCK = `    admin 0.0.0.0:2019 {
        origins ${CADDY_ADMIN_ALLOWED_ORIGINS.join(' ')}
    }`;

function matcherName(host: string, baseDomain: string): string {
  const suffix = '.' + baseDomain;
  return host.endsWith(suffix) ? host.slice(0, -suffix.length) : host;
}

export async function generateCaddyfile(): Promise<string> {
  const siteConfig = await getSiteConfig();
  if (!siteConfig || siteConfig.onboardingStatus !== 'completed') {
    throw new Error('Onboarding is not complete. Configure site settings first.');
  }
  const baseDomain = siteConfig.baseDomain;
  const CADDYFILE_PATH = getCaddyfilePath();

  const sites = await getSites();
  const header = '# Managed by default-site — do not edit manually.';

  const siteBlocks = sites.map(s => {
    const name = matcherName(s.host, baseDomain);
    return `\t@${name} host ${s.host}\n\thandle @${name} {\n\t\treverse_proxy ${s.upstream}\n\t}`;
  });

  const inner = [
    ...siteConfig.siteBlockDirectives.split('\n').map(line => `\t${line}`),
    ...siteBlocks,
    `\thandle {\n\t\treverse_proxy ${siteConfig.dashboardUpstream}\n\t}`,
  ].join('\n\n');

  let globalOptions = '';
  try {
    const existingCaddyfile = await fs.readFile(CADDYFILE_PATH, 'utf8');
    globalOptions = extractGlobalOptionsBlock(existingCaddyfile);
  } catch {
    // Existing file is optional; generate without global options when unavailable.
  }
  globalOptions = ensureAdminGlobalOptions(globalOptions);

  const managedBlock = `${header}\n\n*.${baseDomain}, ${baseDomain} {\n${inner}\n}\n`;
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
