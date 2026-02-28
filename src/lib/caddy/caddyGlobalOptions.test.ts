import { describe, expect, it } from "vitest";
import {
  ensureAdminGlobalOptions,
  extractGlobalOptionsBlock,
} from "~/lib/caddy/caddyfileGenerate";

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

describe("ensureAdminGlobalOptions", () => {
  it("replaces existing admin directive and preserves other directives", () => {
    const options = ensureAdminGlobalOptions(`{
  email admin@example.com
  admin localhost:2019
}`);

    expect(options).toContain("email admin@example.com");
    expect(options).toContain("admin 0.0.0.0:2019");
    expect(options).not.toContain("admin localhost:2019");
  });
});
