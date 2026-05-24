import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/caddy/caddyPreview", () => ({
  previewSiteInCaddy: vi.fn(),
}));

import { previewSiteInCaddy } from "~/lib/caddy/caddyPreview";
import { POST } from "./route";

const mockPreviewSiteInCaddy = vi.mocked(previewSiteInCaddy);

describe("POST /api/sites/test-config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates required fields", async () => {
    const response = await POST(
      new Request("http://localhost/api/sites/test-config", {
        body: JSON.stringify({ subdomain: "", upstream: "" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Subdomain and upstream are required.",
    });
  });

  it("applies a preview config without persisting", async () => {
    mockPreviewSiteInCaddy.mockResolvedValue({
      error: null,
      ok: true,
      status: 200,
    });

    const response = await POST(
      new Request("http://localhost/api/sites/test-config", {
        body: JSON.stringify({
          id: "site-1",
          subdomain: "App",
          upstream: "localhost:3000",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mockPreviewSiteInCaddy).toHaveBeenCalledWith({
      id: "site-1",
      subdomain: "app",
      upstream: "localhost:3000",
    });
  });
});
