import { CADDY_ADMIN_ALLOWED_ORIGINS } from "~/lib/caddy/caddyUrls";

const REQUIRED_ADMIN_BLOCK = `    admin 0.0.0.0:2019 {
        origins ${CADDY_ADMIN_ALLOWED_ORIGINS.join(" ")}
    }`;

export function extractGlobalOptionsBlock(content: string): string {
  let i = 0;

  while (i < content.length) {
    while (i < content.length && /\s/.test(content[i])) i++;

    if (content[i] === "#") {
      while (i < content.length && content[i] !== "\n") i++;
      continue;
    }
    break;
  }

  if (content[i] !== "{") return "";

  const start = i;
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (; i < content.length; i++) {
    const ch = content[i];

    if (quote) {
      if (ch === quote && content[i - 1] !== "\\") quote = null;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === "{") {
      depth++;
      continue;
    }

    if (ch === "}") {
      depth--;
      if (depth === 0) {
        return content.slice(start, i + 1).trim();
      }
    }
  }

  return "";
}

export function ensureAdminGlobalOptions(globalOptions: string): string {
  const trimmed = globalOptions.trim();
  const body = trimmed ? trimmed.replace(/^\{\s*|\s*\}$/g, "") : "";

  const withoutAdmin = body
    .replace(/^\s*admin\b[^\n{]*\{[\s\S]*?^\s*\}\s*$/gm, "")
    .replace(/^\s*admin\b[^\n]*$/gm, "")
    .trim();

  const pieces = withoutAdmin
    ? [withoutAdmin, REQUIRED_ADMIN_BLOCK]
    : [REQUIRED_ADMIN_BLOCK];
  return `{\n${pieces.join("\n\n")}\n}`;
}
