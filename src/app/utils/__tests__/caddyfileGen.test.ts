import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCaddyfile } from '../caddyfileGen';

vi.mock('../siteService', () => ({
  getSites: vi.fn(),
}));

import { getSites } from '../siteService';
const mockGetSites = vi.mocked(getSites);

describe('generateCaddyfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only the managed header and import line when there are no sites', async () => {
    mockGetSites.mockResolvedValue([]);
    const result = await generateCaddyfile();
    expect(result).toContain('# Managed by default-site');
    expect(result).toContain('import /app/Caddyfile.custom');
    expect(result).not.toContain('{');
  });

  it('generates a top-level site block for a single site', async () => {
    mockGetSites.mockResolvedValue([
      { id: '1', host: 'example.com', upstream: 'localhost:3000' },
    ]);
    const result = await generateCaddyfile();
    expect(result).toContain('import /app/Caddyfile.custom');
    expect(result).toContain('example.com {\n\treverse_proxy localhost:3000\n}');
  });

  it('generates a block per site when multiple sites exist', async () => {
    mockGetSites.mockResolvedValue([
      { id: '1', host: 'alpha.com', upstream: 'localhost:3001' },
      { id: '2', host: 'beta.com', upstream: 'localhost:3002' },
    ]);
    const result = await generateCaddyfile();
    expect(result).toContain('alpha.com {\n\treverse_proxy localhost:3001\n}');
    expect(result).toContain('beta.com {\n\treverse_proxy localhost:3002\n}');
  });
});
