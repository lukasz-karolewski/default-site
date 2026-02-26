import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./caddyfileGen', () => ({ generateCaddyfile: vi.fn() }));
vi.mock('fs/promises', () => ({
  default: { writeFile: vi.fn() },
  writeFile: vi.fn(),
}));
vi.mock('~/lib/caddy/caddySyncState', () => ({
  markCaddyFailure: vi.fn(),
  markCaddyfileManagedWrite: vi.fn(),
  markCaddyPending: vi.fn(),
  markCaddySuccess: vi.fn(),
}));
vi.mock('~/lib/data/siteConfig', () => ({
  getSiteConfig: vi.fn(async () => ({ caddyApi: 'http://localhost:2019' })),
}));

import { applyCaddyConfig } from './caddyApi';
import { generateCaddyfile } from './caddyfileGen';
import fs from 'fs/promises';

const mockGenerateCaddyfile = vi.mocked(generateCaddyfile);
const mockWriteFile = vi.mocked(fs.writeFile);

const GENERATED = '# Managed by default-site\n';

describe('applyCaddyConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateCaddyfile.mockResolvedValue(GENERATED);
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response);
  });

  it('writes the generated Caddyfile to CADDYFILE_PATH', async () => {
    await applyCaddyConfig();

    expect(mockWriteFile).toHaveBeenCalledOnce();
    const [path, content] = mockWriteFile.mock.calls[0];
    expect(path).toBe('/app/Caddyfile');
    expect(content).toBe(GENERATED);
  });

  it('POSTs the generated Caddyfile to the Caddy admin API', async () => {
    await applyCaddyConfig();

    expect(fetch).toHaveBeenCalledOnce();
    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toMatch(/\/load$/);
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('text/caddyfile');
    expect(opts.body).toBe(GENERATED);
  });

  it('returns error metadata when API returns non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'internal error',
    } as unknown as Response);

    const result = await applyCaddyConfig();

    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.error).toContain('Caddy API error: 500');
  });
});
