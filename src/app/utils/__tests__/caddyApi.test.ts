import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../siteService', () => ({ getSites: vi.fn() }));
vi.mock('fs/promises', () => ({
  default: { writeFile: vi.fn(), readFile: vi.fn() },
  writeFile: vi.fn(),
  readFile: vi.fn(),
}));

import { applyCaddyConfig } from '../caddyApi';
import { getSites } from '../siteService';
import fs from 'fs/promises';

const mockGetSites = vi.mocked(getSites);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockReadFile = vi.mocked(fs.readFile);

const MAIN_CADDYFILE = 'www.example.com {\n  import /app/sites.caddy\n}\n';

describe('applyCaddyConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadFile.mockResolvedValue(MAIN_CADDYFILE as never);
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
  });

  it('writes an empty sites file and calls the Caddy API when there are no sites', async () => {
    mockGetSites.mockResolvedValue([]);

    await applyCaddyConfig();

    expect(mockWriteFile).toHaveBeenCalledOnce();
    const [, content] = mockWriteFile.mock.calls[0];
    expect(content).toBe('');
  });

  it('writes a block for each site to the sites file', async () => {
    mockGetSites.mockResolvedValue([
      { id: '1', host: 'alpha.com', upstream: 'localhost:3001' },
      { id: '2', host: 'beta.com', upstream: 'localhost:3002' },
    ]);

    await applyCaddyConfig();

    const [, content] = mockWriteFile.mock.calls[0];
    expect(content).toContain('@alpha.com host alpha.com');
    expect(content).toContain('reverse_proxy @alpha.com localhost:3001');
    expect(content).toContain('@beta.com host beta.com');
    expect(content).toContain('reverse_proxy @beta.com localhost:3002');
  });

  it('reads the main Caddyfile and POSTs it to the Caddy admin API', async () => {
    mockGetSites.mockResolvedValue([]);

    await applyCaddyConfig();

    expect(mockReadFile).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledOnce();
    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toMatch(/\/load$/);
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('text/caddyfile');
    expect(opts.body).toBe(MAIN_CADDYFILE);
  });

  it('throws when the Caddy API returns a non-ok response', async () => {
    mockGetSites.mockResolvedValue([]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'internal error',
    } as unknown as Response);

    await expect(applyCaddyConfig()).rejects.toThrow('Caddy API error: 500');
  });
});
