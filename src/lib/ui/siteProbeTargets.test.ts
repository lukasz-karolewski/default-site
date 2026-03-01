import { describe, expect, it } from "vitest";
import { buildSiteProbeTargets } from "./siteProbeTargets";

describe("buildSiteProbeTargets", () => {
  it("rewrites localhost upstream to host gateway first", () => {
    const targets = buildSiteProbeTargets({
      upstream: "localhost:3000",
    });

    expect(targets[0]?.url).toBe("http://host.docker.internal:3000/");
    expect(targets[0]?.canonicalUrl).toBe("http://localhost:3000");
    expect(targets.at(-1)?.url).toBe("http://localhost:3000");
  });

  it("prepends caddy-host targets when subdomain and base domain are present", () => {
    const targets = buildSiteProbeTargets({
      upstream: "service:8080",
      subdomain: "app",
      baseDomain: "example.com",
    });

    expect(targets).toContainEqual({
      url: "http://host.docker.internal",
      canonicalUrl: "https://app.example.com",
      headers: { Host: "app.example.com" },
    });
    expect(targets).toContainEqual({
      url: "http://127.0.0.1",
      canonicalUrl: "https://app.example.com",
      headers: { Host: "app.example.com" },
    });
    expect(targets).toContainEqual({ url: "https://app.example.com" });
    expect(targets).toContainEqual({ url: "http://app.example.com" });
  });

  it("deduplicates equivalent targets", () => {
    const targets = buildSiteProbeTargets({
      upstream: "http://host.docker.internal",
      subdomain: "app",
      baseDomain: "example.com",
    });

    const hostGatewayTargets = targets.filter(
      (target) =>
        target.url === "http://host.docker.internal" && !target.headers,
    );

    expect(hostGatewayTargets).toHaveLength(1);
  });
});
