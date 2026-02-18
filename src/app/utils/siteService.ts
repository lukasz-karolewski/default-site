import { db } from './db';
import { sites } from './schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function addSite(host: string, upstream: string) {
  return db.insert(sites).values({ id: randomUUID(), host, upstream }).run();
}

export async function getSites() {
  return db.select().from(sites).all();
}

export async function removeSite(id: string) {
  return db.delete(sites).where(eq(sites.id, id)).run();
}

export async function updateSite(id: string, host: string, upstream: string) {
  return db.update(sites).set({ host, upstream }).where(eq(sites.id, id)).run();
}
