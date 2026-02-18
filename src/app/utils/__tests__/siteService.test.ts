import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeTestDb } from '../../../test/makeDb';

const testDb = makeTestDb();

vi.mock('../db', () => ({ getDb: () => testDb }));

import { addSite, getSites, removeSite, updateSite } from '../siteService';

describe('siteService', () => {
  beforeEach(async () => {
    // Clear the sites table before each test
    await testDb.delete((await import('../schema')).sites);
  });

  describe('addSite', () => {
    it('inserts a site and returns it via getSites', async () => {
      await addSite('example.com', 'localhost:3000');
      const sites = await getSites();
      expect(sites).toHaveLength(1);
      expect(sites[0]).toMatchObject({ host: 'example.com', upstream: 'localhost:3000' });
      expect(sites[0].id).toBeTypeOf('string');
    });

    it('assigns unique ids to each site', async () => {
      await addSite('a.com', 'localhost:3001');
      await addSite('b.com', 'localhost:3002');
      const sites = await getSites();
      expect(sites[0].id).not.toBe(sites[1].id);
    });
  });

  describe('getSites', () => {
    it('returns an empty array when no sites exist', async () => {
      expect(await getSites()).toEqual([]);
    });

    it('returns all inserted sites', async () => {
      await addSite('a.com', 'localhost:3001');
      await addSite('b.com', 'localhost:3002');
      expect(await getSites()).toHaveLength(2);
    });
  });

  describe('removeSite', () => {
    it('deletes the site with the given id', async () => {
      await addSite('delete-me.com', 'localhost:4000');
      const [site] = await getSites();
      await removeSite(site.id);
      expect(await getSites()).toHaveLength(0);
    });

    it('is a no-op when the id does not exist', async () => {
      await addSite('keep.com', 'localhost:5000');
      await removeSite('non-existent-id');
      expect(await getSites()).toHaveLength(1);
    });
  });

  describe('updateSite', () => {
    it('updates host and upstream for the given id', async () => {
      await addSite('old.com', 'localhost:1000');
      const [site] = await getSites();
      await updateSite(site.id, 'new.com', 'localhost:2000');
      const updated = await getSites();
      expect(updated[0]).toMatchObject({ host: 'new.com', upstream: 'localhost:2000' });
    });

    it('does not affect other sites', async () => {
      await addSite('target.com', 'localhost:1000');
      await addSite('other.com', 'localhost:9999');
      const sites = await getSites();
      const target = sites.find(s => s.host === 'target.com')!;
      await updateSite(target.id, 'updated.com', 'localhost:1001');
      const remaining = await getSites();
      expect(remaining.find(s => s.host === 'other.com')).toBeDefined();
    });
  });
});
