import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs/promises", () => ({
  default: {
    readFile: vi.fn(),
  },
  readFile: vi.fn(),
}));

vi.mock("~/lib/data/siteService", () => ({
  addSite: vi.fn(),
  getSites: vi.fn(),
}));

vi.mock("~/lib/data/siteConfig", () => ({
  getSiteConfig: vi.fn(),
  markOnboardingCompleted: vi.fn(),
  normalizeCaddyApi: vi.fn((v: string) => v.trim()),
  normalizeDirectives: vi.fn((v: string) => v.trim()),
  normalizeDomain: vi.fn((v: string) => v.trim()),
  normalizeUpstream: vi.fn((v: string) => v.trim()),
  upsertSiteConfig: vi.fn(),
}));

vi.mock("~/lib/caddy/caddySync", () => ({
  syncCaddy: vi.fn(),
}));

import fs from "node:fs/promises";
import { parseSitesFromCaddy } from "~/lib/caddy/caddyfileParser";
import { syncCaddy } from "~/lib/caddy/caddySync";
import {
  ensureOnboardingDraft,
  runStartupBootstrap,
} from "~/lib/caddy/onboarding";
import { getSiteConfig, upsertSiteConfig } from "~/lib/data/siteConfig";
import { addSite, getSites } from "~/lib/data/siteService";

const mockReadFile = vi.mocked(fs.readFile);
const mockGetSites = vi.mocked(getSites);
const mockAddSite = vi.mocked(addSite);
const mockGetSiteConfig = vi.mocked(getSiteConfig);
const mockUpsertSiteConfig = vi.mocked(upsertSiteConfig);
const mockSyncCaddy = vi.mocked(syncCaddy);

describe("parseSitesFromCaddy", () => {
  it("parses named matcher style sites", () => {
    const content =
      "@example host example.com\nreverse_proxy @example localhost:3000";
    expect(parseSitesFromCaddy(content)).toEqual([
      { host: "example.com", upstream: "localhost:3000" },
    ]);
  });
});

describe("onboarding bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadFile.mockRejectedValue(new Error("ENOENT"));
    mockGetSites.mockResolvedValue([]);
    mockSyncCaddy.mockResolvedValue({
      applied: true,
      attempted: true,
      error: null,
      pendingChanges: false,
      status: 200,
    });
  });

  it("creates a pending onboarding draft when no config exists", async () => {
    mockGetSiteConfig.mockResolvedValue(undefined);

    await ensureOnboardingDraft();

    expect(mockUpsertSiteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        onboardingStatus: "pending",
      }),
    );
  });

  it("imports parsed sites into db when sites are empty", async () => {
    mockGetSiteConfig.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue(
      "@ha host ha.example.com\nreverse_proxy @ha localhost:8123\n" as never,
    );

    await ensureOnboardingDraft();

    expect(mockAddSite).toHaveBeenCalledWith("ha", "localhost:8123");
  });

  it("applies config on startup when onboarding is completed", async () => {
    mockGetSiteConfig.mockResolvedValue({
      baseDomain: "example.com",
      caddyApi: "http://localhost:2019",
      dashboardUpstream: "localhost:3080",
      id: "singleton",
      onboardingStatus: "completed",
      siteBlockDirectives: "tls internal",
    });

    await runStartupBootstrap();

    expect(mockSyncCaddy).toHaveBeenCalledOnce();
  });
});
