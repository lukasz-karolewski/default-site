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

  it('returns an empty string when there are no sites', async () => {
    mockGetSites.mockResolvedValue([]);
    expect(await generateCaddyfile()).toBe('');
  });

  it('generates a matcher + reverse_proxy block for a single site', async () => {
    mockGetSites.mockResolvedValue([
      { id: '1', host: 'example.com', upstream: 'localhost:3000' },
    ]);
    const result = await generateCaddyfile();
    expect(result).toContain('@example.com host example.com');
    expect(result).toContain('reverse_proxy @example.com localhost:3000');
  });

  it('generates a block per site when multiple sites exist', async () => {
    mockGetSites.mockResolvedValue([
      { id: '1', host: 'alpha.com', upstream: 'localhost:3001' },
      { id: '2', host: 'beta.com', upstream: 'localhost:3002' },
    ]);
    const result = await generateCaddyfile();
    expect(result).toContain('@alpha.com host alpha.com');
    expect(result).toContain('reverse_proxy @alpha.com localhost:3001');
    expect(result).toContain('@beta.com host beta.com');
    expect(result).toContain('reverse_proxy @beta.com localhost:3002');
  });
});
