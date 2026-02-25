import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../utils/siteService', () => ({
  getSites: vi.fn(),
}));

import { GET } from '../route';
import { getSites } from '../../../utils/siteService';

const mockGetSites = vi.mocked(getSites);

describe('GET /api/sites', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the site list as JSON', async () => {
    const sites = [{ id: '1', host: 'a.com', upstream: 'localhost:3000' }];
    mockGetSites.mockResolvedValue(sites);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(sites);
  });
});
