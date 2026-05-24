import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateCaddyfile } from "./caddyfileGenerate";
import { extractGlobalOptionsBlock } from "./caddyfileParser";

vi.mock("~/lib/data/siteService", () => ({
  getSites: vi.fn(),
}));
vi.mock("~/lib/data/siteConfig", () => ({
  getSiteConfig: vi.fn(),
}));
vi.mock("fs/promises", () => ({
  default: {
    readFile: vi.fn(),
  },
  readFile: vi.fn(),
}));

import fs from "node:fs/promises";
import { getSiteConfig } from "~/lib/data/siteConfig";
import { getSites } from "~/lib/data/siteService";

const mockGetSites = vi.mocked(getSites);
const mockGetSiteConfig = vi.mocked(getSiteConfig);
const mockReadFile = vi.mocked(fs.readFile);

describe("generateCaddyfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadFile.mockRejectedValue(new Error("ENOENT"));
    mockGetSiteConfig.mockResolvedValue({
      baseDomain: "test.com",
      caddyApi: "http://host.docker.internal:2019",
      dashboardUpstream: "localhost:3080",
      id: "singleton",
      onboardingStatus: "completed",
      siteBlockDirectives: "tls internal\nlog",
    });
  });

  it("renders site block directives from DB config", async () => {
    mockGetSites.mockResolvedValue([]);
    const result = await generateCaddyfile();

    expect(result).toContain("admin 0.0.0.0:2019 {");
    expect(result).toContain("origins localhost:2019 127.0.0.1:2019");
    expect(result).toContain("*.test.com, test.com {");
    expect(result).toContain("\ttls internal");
    expect(result).toContain("\tlog");
    expect(result).not.toContain("Caddyfile.custom");
  });

  it("generates matcher blocks for sites", async () => {
    mockGetSites.mockResolvedValue([
      { favicon: null, id: "1", subdomain: "ha", upstream: "localhost:8123" },
    ]);

    const result = await generateCaddyfile();

    expect(result).toContain("@ha host ha.test.com");
    expect(result).toContain("handle @ha {");
    expect(result).toContain("reverse_proxy localhost:8123");
  });

  it("throws when onboarding is not complete", async () => {
    mockGetSites.mockResolvedValue([]);
    mockGetSiteConfig.mockResolvedValue({
      baseDomain: "test.com",
      caddyApi: "http://host.docker.internal:2019",
      dashboardUpstream: "localhost:3080",
      id: "singleton",
      onboardingStatus: "pending",
      siteBlockDirectives: "tls internal",
    });

    await expect(generateCaddyfile()).rejects.toThrow(
      "Onboarding is not complete",
    );
  });

  it("preserves global options block from existing Caddyfile", async () => {
    mockGetSites.mockResolvedValue([]);
    mockReadFile.mockResolvedValue(
      `{
    email admin@example.com
    admin localhost:2019
}

example.com {
    respond "old"
}
` as never,
    );

    const result = await generateCaddyfile();

    expect(result).toContain("email admin@example.com");
    expect(result).toContain("admin 0.0.0.0:2019 {");
    expect(result).toContain("origins localhost:2019 127.0.0.1:2019");
    expect(result).toContain("*.test.com, test.com {");
  });
});

describe("extractGlobalOptionsBlock", () => {
  it("extracts top-level global options block", () => {
    const block = extractGlobalOptionsBlock(`
# comment
{
  email admin@example.com
}

example.com {
  respond "ok"
}
`);

    expect(block).toContain("email admin@example.com");
    expect(block.startsWith("{")).toBe(true);
  });

  it("returns empty string when no global options are present", () => {
    expect(extractGlobalOptionsBlock('example.com {\n respond "ok"\n}\n')).toBe(
      "",
    );
  });
});
