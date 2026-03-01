import { describe, expect, it } from "vitest";
import { getUpstreamRedirectHost } from "./upstreamHost";

describe("getUpstreamRedirectHost", () => {
  it("returns hostname without port", () => {
    expect(getUpstreamRedirectHost("http://localhost:3000")).toBe("localhost");
    expect(getUpstreamRedirectHost("http://example.com:8080/path")).toBe(
      "example.com",
    );
    expect(getUpstreamRedirectHost("http://APP.LOCAL:443")).toBe("app.local");
  });

  it("returns empty string for invalid input", () => {
    expect(getUpstreamRedirectHost("localhost:3000")).toBe("");
    expect(getUpstreamRedirectHost("not a url")).toBe("");
  });
});
