import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('../../../utils/siteService', () => ({
  getSites: vi.fn(),
  addSite: vi.fn(),
  updateSite: vi.fn(),
  removeSite: vi.fn(),
}));
vi.mock('../../../utils/caddyApi', () => ({
  applyCaddyConfig: vi.fn(),
}));

import { GET, POST, PUT, DELETE } from '../route';
import { getSites, addSite, updateSite, removeSite } from '../../../utils/siteService';
import { applyCaddyConfig } from '../../../utils/caddyApi';

const mockGetSites = vi.mocked(getSites);
const mockAddSite = vi.mocked(addSite);
const mockUpdateSite = vi.mocked(updateSite);
const mockRemoveSite = vi.mocked(removeSite);
const mockApply = vi.mocked(applyCaddyConfig);

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/sites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

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

describe('POST /api/sites', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds a site and applies caddy config', async () => {
    mockAddSite.mockResolvedValue(undefined as never);
    mockApply.mockResolvedValue(true);

    const res = await POST(makeRequest({ host: 'new.com', upstream: 'localhost:4000' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockAddSite).toHaveBeenCalledWith('new.com', 'localhost:4000');
    expect(mockApply).toHaveBeenCalledOnce();
  });
});

describe('PUT /api/sites', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates a site and applies caddy config', async () => {
    mockUpdateSite.mockResolvedValue(undefined as never);
    mockApply.mockResolvedValue(true);

    const res = await PUT(
      makeRequest({ id: '42', host: 'updated.com', upstream: 'localhost:5000' }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockUpdateSite).toHaveBeenCalledWith('42', 'updated.com', 'localhost:5000');
    expect(mockApply).toHaveBeenCalledOnce();
  });
});

describe('DELETE /api/sites', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes a site and applies caddy config', async () => {
    mockRemoveSite.mockResolvedValue(undefined as never);
    mockApply.mockResolvedValue(true);

    const res = await DELETE(makeRequest({ id: '42' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockRemoveSite).toHaveBeenCalledWith('42');
    expect(mockApply).toHaveBeenCalledOnce();
  });
});
