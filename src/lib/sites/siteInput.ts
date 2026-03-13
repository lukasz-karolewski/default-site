export interface SiteInput {
  subdomain: string;
  upstream: string;
}

export function normalizeSiteInput(input: SiteInput): SiteInput {
  return {
    subdomain: input.subdomain.trim().toLowerCase(),
    upstream: input.upstream.trim(),
  };
}

export function validateSiteInput(input: SiteInput): string | null {
  if (!input.subdomain || !input.upstream) {
    return "Subdomain and upstream are required.";
  }

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(input.subdomain)) {
    return "Subdomain may only contain letters, digits, and hyphens.";
  }

  return null;
}
