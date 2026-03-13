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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: "", upstream: "" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Subdomain and upstream are required.",
    });
  });

  it("applies a preview config without persisting", async () => {
    mockPreviewSiteInCaddy.mockResolvedValue({
      ok: true,
      error: null,
      status: 200,
    });

    const response = await POST(
      new Request("http://localhost/api/sites/test-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "site-1",
          subdomain: "App",
          upstream: "localhost:3000",
        }),
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
