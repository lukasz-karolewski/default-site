import { getDb } from "./db";
import { sites } from "./schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function addSite(host: string, upstream: string) {
	return getDb()
		.insert(sites)
		.values({ id: randomUUID(), host, upstream })
		.run();
}

export async function getSites() {
	return getDb().select().from(sites).all();
}

export async function removeSite(id: string) {
	return getDb().delete(sites).where(eq(sites.id, id)).run();
}

export async function updateSite(id: string, host: string, upstream: string) {
	return getDb()
		.update(sites)
		.set({ host, upstream })
		.where(eq(sites.id, id))
		.run();
}
