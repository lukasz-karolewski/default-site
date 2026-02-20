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
  },
  readFile: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
}));

vi.mock('../caddyApi', () => ({
  applyCaddyConfig: vi.fn(),
}));

import { parseSitesFromCaddy, runFirstTimeSetup } from '../firstRunSetup';
import { getSites, addSite } from '../siteService';
import fs from 'fs/promises';
import { applyCaddyConfig } from '../caddyApi';

const mockGetSites = vi.mocked(getSites);
const mockAddSite = vi.mocked(addSite);
const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockStat = vi.mocked(fs.stat);
const mockApplyCaddyConfig = vi.mocked(applyCaddyConfig);

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

  it('parses multiple named-matcher blocks', () => {
    const content = [
      '@alpha.com host alpha.com\nreverse_proxy @alpha.com localhost:3001',
      '@beta.com host beta.com\nreverse_proxy @beta.com localhost:3002',
    ].join('\n\n');
    expect(parseSitesFromCaddy(content)).toEqual([
      { host: 'alpha.com', upstream: 'localhost:3001' },
      { host: 'beta.com', upstream: 'localhost:3002' },
    ]);
  });

  it('ignores unrelated lines and only extracts matched sites', () => {
    const content = 'www.example.com {\n  log\n}\n@foo.com host foo.com\nreverse_proxy @foo.com localhost:9000';
    expect(parseSitesFromCaddy(content)).toEqual([
      { host: 'foo.com', upstream: 'localhost:9000' },
    ]);
  });
});

describe('runFirstTimeSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddSite.mockResolvedValue(undefined as never);
    mockApplyCaddyConfig.mockResolvedValue(true);
    mockStat.mockResolvedValue({} as never);
  });

  it('skips setup when DB already has sites', async () => {
    mockGetSites.mockResolvedValue([{ id: '1', host: 'example.com', upstream: 'localhost:3000' }]);

    await runFirstTimeSetup();

    expect(mockAddSite).not.toHaveBeenCalled();
    expect(mockApplyCaddyConfig).not.toHaveBeenCalled();
  });

  it('imports sites from Caddyfile when it has content', async () => {
    mockGetSites.mockResolvedValue([]);
    mockReadFile.mockResolvedValue('@example.com host example.com\nreverse_proxy @example.com localhost:3000\n' as never);

    await runFirstTimeSetup();

    expect(mockAddSite).toHaveBeenCalledOnce();
    expect(mockAddSite).toHaveBeenCalledWith('example.com', 'localhost:3000');
    expect(mockApplyCaddyConfig).toHaveBeenCalledOnce();
  });

  it('imports sites from Caddyfile', async () => {
    mockGetSites.mockResolvedValue([]);
    mockReadFile.mockResolvedValue(CADDYFILE_CONTENT as never);

    await runFirstTimeSetup();

    expect(mockAddSite).toHaveBeenCalledOnce();
    expect(mockAddSite).toHaveBeenCalledWith('alpha.com', 'localhost:3001');
    expect(mockApplyCaddyConfig).toHaveBeenCalledOnce();
  });

  it('imports no sites when Caddyfile is empty', async () => {
    mockGetSites.mockResolvedValue([]);
    mockReadFile.mockResolvedValue('   ' as never);

    await runFirstTimeSetup();

    expect(mockAddSite).not.toHaveBeenCalled();
    expect(mockApplyCaddyConfig).toHaveBeenCalledOnce();
  });

  it('creates Caddyfile.custom if it does not exist', async () => {
    mockGetSites.mockResolvedValue([]);
    mockReadFile.mockResolvedValue('' as never);
    mockStat.mockRejectedValue(ENOENT);

    await runFirstTimeSetup();

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('Caddyfile.custom'),
      '',
      'utf8',
    );
  });

  it('does not create Caddyfile.custom if it already exists', async () => {
    mockGetSites.mockResolvedValue([]);
    mockReadFile.mockResolvedValue('' as never);
    mockStat.mockResolvedValue({} as never);

    await runFirstTimeSetup();

    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('de-duplicates sites with the same host', async () => {
    mockGetSites.mockResolvedValue([]);
    const dupContent = '@foo.com host foo.com\nreverse_proxy @foo.com localhost:3001\n@foo.com host foo.com\nreverse_proxy @foo.com localhost:3002';
    mockReadFile.mockResolvedValue(dupContent as never);

    await runFirstTimeSetup();

    expect(mockAddSite).toHaveBeenCalledOnce();
    expect(mockAddSite).toHaveBeenCalledWith('foo.com', 'localhost:3001');
  });
});
