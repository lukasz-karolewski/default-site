import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/data/siteService", () => ({
  getCaddySyncStateSnapshot: vi.fn(),
}));
vi.mock("~/lib/caddy/caddySyncPipeline", () => ({
  syncCaddy: vi.fn(),
}));

import {
  ensureCaddyRetryLoop,
  stopCaddyRetryLoop,
} from "~/lib/caddy/caddyRetryLoop";
import { syncCaddy } from "~/lib/caddy/caddySyncPipeline";
import { getCaddySyncStateSnapshot } from "~/lib/data/siteService";

const mockSnapshot = vi.mocked(getCaddySyncStateSnapshot);
const mockSyncCaddy = vi.mocked(syncCaddy);

describe("retry loop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    process.env.CADDY_RETRY_SECONDS = "1";
    stopCaddyRetryLoop();
    mockSnapshot.mockResolvedValue({ pendingChanges: true } as never);
    mockSyncCaddy.mockResolvedValue({
      ok: true,
      error: null,
      status: 200,
    } as never);
  });

  it("starts only one loop and retries when pending changes exist", async () => {
    ensureCaddyRetryLoop();
    ensureCaddyRetryLoop();

    await vi.advanceTimersByTimeAsync(1000);

    expect(mockSnapshot).toHaveBeenCalledTimes(1);
    expect(mockSyncCaddy).toHaveBeenCalledTimes(1);
  });
});
