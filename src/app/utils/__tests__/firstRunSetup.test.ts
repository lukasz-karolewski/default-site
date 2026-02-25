import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../siteService', () => ({
  getSites: vi.fn(),
  addSite: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    stat: vi.fn(),
    copyFile: vi.fn(),
  },
  readFile: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
  copyFile: vi.fn(),
}));

vi.mock('../caddyApi', () => ({
  applyCaddyConfig: vi.fn(),
  applyCaddyConfigStrict: vi.fn(),
}));
vi.mock('../caddySyncScheduler', () => ({
  ensureCaddyRetryLoop: vi.fn(),
}));
vi.mock('../caddySyncState', () => ({
  getCaddyStartupMode: vi.fn(() => 'degraded'),
}));

import { parseSitesFromCaddy, runFirstTimeSetup } from '../firstRunSetup';
import { getSites, addSite } from '../siteService';
import fs from 'fs/promises';
import { applyCaddyConfig, applyCaddyConfigStrict } from '../caddyApi';
import { getCaddyStartupMode } from '../caddySyncState';

const mockGetSites = vi.mocked(getSites);
const mockAddSite = vi.mocked(addSite);
const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockStat = vi.mocked(fs.stat);
const mockCopyFile = vi.mocked(fs.copyFile);
const mockApplyCaddyConfig = vi.mocked(applyCaddyConfig);
const mockApplyCaddyConfigStrict = vi.mocked(applyCaddyConfigStrict);
const mockStartupMode = vi.mocked(getCaddyStartupMode);

const ENOENT = Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' });

const CADDYFILE_CONTENT = '@alpha.com host alpha.com\nreverse_proxy @alpha.com localhost:3001\n';

describe('parseSitesFromCaddy', () => {
  it('returns an empty array for an empty string', () => {
    expect(parseSitesFromCaddy('')).toEqual([]);
  });

  it('parses a single named-matcher block', () => {
    const content = '@example.com host example.com\nreverse_proxy @example.com localhost:3000';
    expect(parseSitesFromCaddy(content)).toEqual([
      { host: 'example.com', upstream: 'localhost:3000' },
    ]);
  });

  it('parses handle format blocks', () => {
    const content = '@foo host foo.com\nhandle @foo {\n  reverse_proxy localhost:9000\n}';
    expect(parseSitesFromCaddy(content)).toEqual([
      { host: 'foo.com', upstream: 'localhost:9000' },
    ]);
  });
});

describe('runFirstTimeSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddSite.mockResolvedValue(undefined as never);
    mockApplyCaddyConfig.mockResolvedValue({ ok: true, error: null, status: 200 });
    mockApplyCaddyConfigStrict.mockResolvedValue(undefined);
    mockStartupMode.mockReturnValue('degraded');
    mockStat.mockResolvedValue({} as never);
    mockCopyFile.mockResolvedValue(undefined as never);
  });

  it('skips import setup when DB already has sites but still applies sync policy', async () => {
    mockGetSites.mockResolvedValue([{ id: '1', host: 'example.com', upstream: 'localhost:3000' }]);

    await runFirstTimeSetup();

    expect(mockAddSite).not.toHaveBeenCalled();
    expect(mockCopyFile).not.toHaveBeenCalled();
    expect(mockApplyCaddyConfig).toHaveBeenCalledOnce();
  });

  it('imports sites from Caddyfile when it has content', async () => {
    mockGetSites.mockResolvedValue([]);
    mockReadFile.mockResolvedValue(CADDYFILE_CONTENT as never);

    await runFirstTimeSetup();

    expect(mockAddSite).toHaveBeenCalledOnce();
    expect(mockAddSite).toHaveBeenCalledWith('alpha.com', 'localhost:3001');
    expect(mockCopyFile).toHaveBeenCalledWith('/app/Caddyfile', '/app/Caddyfile.bak');
    expect(mockApplyCaddyConfig).toHaveBeenCalledOnce();
  });

  it('continues in degraded mode when caddy apply fails', async () => {
    mockGetSites.mockResolvedValue([]);
    mockReadFile.mockResolvedValue('' as never);
    mockApplyCaddyConfig.mockResolvedValue({ ok: false, error: 'down', status: null });

    await expect(runFirstTimeSetup()).resolves.not.toThrow();
  });

  it('uses strict startup mode when configured', async () => {
    mockStartupMode.mockReturnValue('strict');
    mockGetSites.mockResolvedValue([]);
    mockReadFile.mockResolvedValue('' as never);

    await runFirstTimeSetup();

    expect(mockApplyCaddyConfigStrict).toHaveBeenCalledOnce();
    expect(mockApplyCaddyConfig).not.toHaveBeenCalled();
  });

  it('creates Caddyfile.custom if it does not exist', async () => {
    mockGetSites.mockResolvedValue([]);
    mockReadFile.mockResolvedValue('' as never);
    mockStat.mockRejectedValue(ENOENT);

    await runFirstTimeSetup();

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('Caddyfile.custom'),
      'tls internal\nlog\n',
      'utf8',
    );
  });

  it('continues when Caddyfile does not exist to back up', async () => {
    mockGetSites.mockResolvedValue([]);
    mockReadFile.mockResolvedValue('' as never);
    mockCopyFile.mockRejectedValue(ENOENT);

    await runFirstTimeSetup();

    expect(mockApplyCaddyConfig).toHaveBeenCalledOnce();
  });
});
