import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
  },
  readFile: vi.fn(),
}));

vi.mock('~/lib/data/siteService', () => ({
  getSites: vi.fn(),
  addSite: vi.fn(),
}));

vi.mock('~/lib/data/siteConfig', () => ({
  getSiteConfig: vi.fn(),
  upsertSiteConfig: vi.fn(),
  markOnboardingCompleted: vi.fn(),
  normalizeDirectives: vi.fn((v: string) => v.trim()),
  normalizeDomain: vi.fn((v: string) => v.trim()),
  normalizeUpstream: vi.fn((v: string) => v.trim()),
}));

vi.mock('~/lib/caddy/caddyApi', () => ({
  applyCaddyConfig: vi.fn(),
}));

vi.mock('~/lib/caddy/caddySyncScheduler', () => ({
  ensureCaddyRetryLoop: vi.fn(),
}));

import fs from 'fs/promises';
import { getSites, addSite } from '~/lib/data/siteService';
import { getSiteConfig, upsertSiteConfig } from '~/lib/data/siteConfig';
import { ensureOnboardingDraft, parseSitesFromCaddy, runStartupBootstrap } from './onboarding';
import { applyCaddyConfig } from '~/lib/caddy/caddyApi';
import { ensureCaddyRetryLoop } from '~/lib/caddy/caddySyncScheduler';

const mockReadFile = vi.mocked(fs.readFile);
const mockGetSites = vi.mocked(getSites);
const mockAddSite = vi.mocked(addSite);
const mockGetSiteConfig = vi.mocked(getSiteConfig);
const mockUpsertSiteConfig = vi.mocked(upsertSiteConfig);
const mockApplyCaddyConfig = vi.mocked(applyCaddyConfig);
const mockEnsureRetry = vi.mocked(ensureCaddyRetryLoop);

describe('parseSitesFromCaddy', () => {
  it('parses named matcher style sites', () => {
    const content = '@example host example.com\nreverse_proxy @example localhost:3000';
    expect(parseSitesFromCaddy(content)).toEqual([
      { host: 'example.com', upstream: 'localhost:3000' },
    ]);
  });
});

describe('onboarding bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    mockGetSites.mockResolvedValue([]);
    mockApplyCaddyConfig.mockResolvedValue({ ok: true, error: null, status: 200 });
  });

  it('creates a pending onboarding draft when no config exists', async () => {
    mockGetSiteConfig.mockResolvedValue(undefined);

    await ensureOnboardingDraft();

    expect(mockUpsertSiteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        onboardingStatus: 'pending',
      }),
    );
  });

  it('imports parsed sites into db when sites are empty', async () => {
    mockGetSiteConfig.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue('@ha host ha.example.com\nreverse_proxy @ha localhost:8123\n' as never);

    await ensureOnboardingDraft();

    expect(mockAddSite).toHaveBeenCalledWith('ha.example.com', 'localhost:8123');
  });

  it('applies config on startup when onboarding is completed', async () => {
    mockGetSiteConfig.mockResolvedValue({
      id: 'singleton',
      baseDomain: 'example.com',
      caddyApi: 'http://localhost:2019',
      dashboardUpstream: 'localhost:3080',
      siteBlockDirectives: 'tls internal',
      onboardingStatus: 'completed',
    });

    await runStartupBootstrap();

    expect(mockApplyCaddyConfig).toHaveBeenCalledOnce();
    expect(mockEnsureRetry).toHaveBeenCalledOnce();
  });
});
