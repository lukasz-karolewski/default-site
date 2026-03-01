/**
 * Generate a deterministic gradient avatar SVG data URI for a subdomain.
 * Produces a rounded-square (Slack-style) with a linear gradient and
 * the first letter of the subdomain centered inside.
 */
export function generateAvatarSvg(subdomain: string): string {
  const hash = simpleHash(subdomain);
  const hue1 = hash % 360;
  const hue2 = (hash * 7 + 137) % 360;
  const color1 = `hsl(${hue1}, 70%, 55%)`;
  const color2 = `hsl(${hue2}, 65%, 45%)`;
  const letter = (subdomain[0] ?? "?").toUpperCase();

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">`,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0%" stop-color="${color1}"/>`,
    `<stop offset="100%" stop-color="${color2}"/>`,
    `</linearGradient></defs>`,
    `<rect width="64" height="64" rx="14" fill="url(#g)"/>`,
    `<text x="32" y="32" text-anchor="middle" dominant-baseline="central" font-family="system-ui,sans-serif" font-size="30" font-weight="600" fill="white">${letter}</text>`,
    `</svg>`,
  ].join("");

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
