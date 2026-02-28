import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs/promises", () => ({
  default: {
    stat: vi.fn(),
    readFile: vi.fn(),
  },
  stat: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock("~/lib/config/runtimePaths", () => ({
  getCaddyfilePath: vi.fn(() => "/app/Caddyfile"),
}));

vi.mock("~/lib/caddy/caddySyncState", () => ({
  getCaddySyncSnapshot: vi.fn(),
}));

import fs from "node:fs/promises";
import { buildCaddyStatusPayload } from "~/lib/caddy/caddyStatusPayload";
import { getCaddySyncSnapshot } from "~/lib/caddy/caddySyncState";

const mockStat = vi.mocked(fs.stat);
const mockReadFile = vi.mocked(fs.readFile);
const mockSnapshot = vi.mocked(getCaddySyncSnapshot);

describe("buildCaddyStatusPayload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSnapshot.mockResolvedValue({
      connected: true,
      lastError: null,
      lastAttemptAt: null,
      lastSuccessAt: null,
      pendingChanges: false,
      caddyApiUrl: "http://localhost:2019",
      lastManagedWriteAt: "2026-02-26T00:00:00.000Z",
      lastManagedWriteHash:
        "5c6c35d12723f2003e84b567446ebfbabfe8ff36a258a00b0985d62abddce1e3",
    });
  });

  it("reports unchanged when file hash matches last managed write hash", async () => {
    mockStat.mockResolvedValue({
      mtime: new Date("2026-02-26T00:01:00.000Z"),
      size: 123,
    } as never);
    mockReadFile.mockResolvedValue("managed-caddyfile" as never);

    const payload = await buildCaddyStatusPayload();

    expect(payload.caddyfile.exists).toBe(true);
    expect(payload.caddyfile.changedSinceLastManagedWrite).toBe(false);
    expect(payload.caddyfile.modifiedAt).toBe("2026-02-26T00:01:00.000Z");
    expect(payload.caddyfile.sizeBytes).toBe(123);
  });

  it("reports changed when file hash differs from last managed write hash", async () => {
    mockStat.mockResolvedValue({
      mtime: new Date("2026-02-26T00:02:00.000Z"),
      size: 321,
    } as never);
    mockReadFile.mockResolvedValue("someone-edited-this-file" as never);

    const payload = await buildCaddyStatusPayload();

    expect(payload.caddyfile.exists).toBe(true);
    expect(payload.caddyfile.changedSinceLastManagedWrite).toBe(true);
  });

  it("reports missing file state when caddyfile is absent", async () => {
    const enoent = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    mockStat.mockRejectedValue(enoent);

    const payload = await buildCaddyStatusPayload();

    expect(payload.caddyfile.exists).toBe(false);
    expect(payload.caddyfile.hash).toBeNull();
    expect(payload.caddyfile.changedSinceLastManagedWrite).toBeNull();
  });
});
