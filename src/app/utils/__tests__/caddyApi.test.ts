import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../caddyfileGen', () => ({ generateCaddyfile: vi.fn() }));
vi.mock('fs/promises', () => ({
  default: { writeFile: vi.fn() },
  writeFile: vi.fn(),
}));

import { applyCaddyConfig } from '../caddyApi';
import { generateCaddyfile } from '../caddyfileGen';
import fs from 'fs/promises';

const mockGenerateCaddyfile = vi.mocked(generateCaddyfile);
const mockWriteFile = vi.mocked(fs.writeFile);

const GENERATED = '# Managed by default-site — do not edit manually.\n# Use Caddyfile.custom for global options, TLS config, and extra blocks.\n\nimport /app/Caddyfile.custom\n';

describe('applyCaddyConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateCaddyfile.mockResolvedValue(GENERATED);
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
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

  it('throws when the Caddy API returns a non-ok response', async () => {
    mockGenerateCaddyfile.mockResolvedValue(GENERATED);
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'internal error',
    } as unknown as Response);

    await expect(applyCaddyConfig()).rejects.toThrow('Caddy API error: 500');
  });
});
