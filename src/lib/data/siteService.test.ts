import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTestDb } from "../../test/makeDb";

const testDb = makeTestDb();

vi.mock("./db", () => ({ getDb: () => testDb }));

import { addSite, getSites, removeSite, updateSite } from "./siteService";

describe("siteService", () => {
  beforeEach(async () => {
    // Clear the sites table before each test
    await testDb.delete((await import("./schema")).sites);
  });

  describe("addSite", () => {
    it("inserts a site and returns it via getSites", async () => {
      await addSite("example", "localhost:3000");
      const sites = await getSites();
      expect(sites).toHaveLength(1);
      expect(sites[0]).toMatchObject({
        subdomain: "example",
        upstream: "localhost:3000",
      });
      expect(sites[0].id).toBeTypeOf("string");
    });

    it("assigns unique ids to each site", async () => {
      await addSite("a", "localhost:3001");
      await addSite("b", "localhost:3002");
      const sites = await getSites();
      expect(sites[0].id).not.toBe(sites[1].id);
    });
  });

  describe("getSites", () => {
    it("returns an empty array when no sites exist", async () => {
      expect(await getSites()).toEqual([]);
    });

    it("returns all inserted sites", async () => {
      await addSite("a", "localhost:3001");
      await addSite("b", "localhost:3002");
      expect(await getSites()).toHaveLength(2);
    });
  });

  describe("removeSite", () => {
    it("deletes the site with the given id", async () => {
      await addSite("delete-me", "localhost:4000");
      const [site] = await getSites();
      await removeSite(site.id);
      expect(await getSites()).toHaveLength(0);
    });

    it("is a no-op when the id does not exist", async () => {
      await addSite("keep", "localhost:5000");
      await removeSite("non-existent-id");
      expect(await getSites()).toHaveLength(1);
    });
  });

  describe("updateSite", () => {
    it("updates subdomain and upstream for the given id", async () => {
      await addSite("old", "localhost:1000");
      const [site] = await getSites();
      await updateSite(site.id, "new", "localhost:2000");
      const updated = await getSites();
      expect(updated[0]).toMatchObject({
        subdomain: "new",
        upstream: "localhost:2000",
      });
    });

    it("does not affect other sites", async () => {
      await addSite("target", "localhost:1000");
      await addSite("other", "localhost:9999");
      const sites = await getSites();
      const target = sites.find((s) => s.subdomain === "target");
      expect(target).toBeDefined();
      if (!target) {
        throw new Error("target not found");
      }
      await updateSite(target.id, "updated", "localhost:1001");
      const remaining = await getSites();
      expect(remaining.find((s) => s.subdomain === "other")).toBeDefined();
    });
  });
});
