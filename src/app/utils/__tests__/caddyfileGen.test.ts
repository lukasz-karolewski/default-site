import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCaddyfile } from '../caddyfileGen';

vi.mock('../siteService', () => ({
  getSites: vi.fn(),
}));
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
  },
  readFile: vi.fn(),
}));

import { getSites } from '../siteService';
import fs from 'fs/promises';
const mockGetSites = vi.mocked(getSites);
const mockReadFile = vi.mocked(fs.readFile);

describe('generateCaddyfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BASE_DOMAIN = 'test.com';
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
  });

  afterEach(() => {
    delete process.env.BASE_DOMAIN;
  });

  it('returns wildcard block with import and catchall when there are no sites', async () => {
    mockGetSites.mockResolvedValue([]);
    const result = await generateCaddyfile();
    expect(result).toContain('admin 0.0.0.0:2019 {');
    expect(result).toContain('origins host.docker.internal:2019 localhost:2019 127.0.0.1:2019');
    expect(result).toContain('*.test.com, test.com {');
    expect(result).toContain('import /etc/caddy/Caddyfile.custom');
    expect(result).toContain('handle {\n\t\treverse_proxy localhost:3080\n\t}');
    expect(result).not.toContain('@');
  });

  it('generates a named matcher block for a single site', async () => {
    mockGetSites.mockResolvedValue([
      { id: '1', host: 'ha.test.com', upstream: 'localhost:8123' },
    ]);
    const result = await generateCaddyfile();
    expect(result).toContain('@ha host ha.test.com');
    expect(result).toContain('handle @ha {');
    expect(result).toContain('reverse_proxy localhost:8123');
  });

  it('generates matcher blocks for multiple sites', async () => {
    mockGetSites.mockResolvedValue([
      { id: '1', host: 'ha.test.com', upstream: 'localhost:8123' },
      { id: '2', host: 'wg.test.com', upstream: 'localhost:8888' },
    ]);
    const result = await generateCaddyfile();
    expect(result).toContain('@ha host ha.test.com');
    expect(result).toContain('handle @ha {');
    expect(result).toContain('@wg host wg.test.com');
    expect(result).toContain('handle @wg {');
  });

  it('uses full hostname as matcher name when host is not under BASE_DOMAIN', async () => {
    mockGetSites.mockResolvedValue([
      { id: '1', host: 'other.example.com', upstream: 'localhost:9000' },
    ]);
    const result = await generateCaddyfile();
    expect(result).toContain('@other.example.com host other.example.com');
  });

  it('throws if BASE_DOMAIN is not set', async () => {
    delete process.env.BASE_DOMAIN;
    mockGetSites.mockResolvedValue([]);
    await expect(generateCaddyfile()).rejects.toThrow('BASE_DOMAIN environment variable is required');
  });

  it('preserves global options block from existing Caddyfile', async () => {
    mockGetSites.mockResolvedValue([]);
    mockReadFile.mockResolvedValue(`{
    email admin@example.com
    admin localhost:2019
}

# old config below
example.com {
    respond "old"
}
` as never);

    const result = await generateCaddyfile();

    expect(result).toContain('email admin@example.com');
    expect(result).toContain('admin 0.0.0.0:2019 {');
    expect(result).toContain('origins host.docker.internal:2019 localhost:2019 127.0.0.1:2019');
    expect(result).toContain('*.test.com, test.com {');
  });
});
