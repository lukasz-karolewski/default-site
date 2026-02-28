import { eq } from "drizzle-orm";
import { caddySyncState } from "~/lib/data/schema";
import { getDb } from "~/lib/data/db";
import { getSiteConfig } from "~/lib/data/siteConfig";

const STATE_ID = "singleton";

export interface CaddySyncSnapshot {
	connected: boolean;
	lastError: string | null;
	lastAttemptAt: string | null;
	lastSuccessAt: string | null;
	pendingChanges: boolean;
	caddyApiUrl: string;
	lastManagedWriteAt: string | null;
	lastManagedWriteHash: string | null;
}

async function ensureStateRow() {
	await getDb()
		.insert(caddySyncState)
		.values({
			id: STATE_ID,
			connected: true,
			pendingChanges: false,
		})
		.onConflictDoNothing({ target: caddySyncState.id })
		.run();
}

async function readStateRow() {
	await ensureStateRow();
	return getDb()
		.select()
		.from(caddySyncState)
		.where(eq(caddySyncState.id, STATE_ID))
		.get();
}

function nowIso() {
	return new Date().toISOString();
}

export async function markCaddyPending() {
	await ensureStateRow();
	await getDb()
		.update(caddySyncState)
		.set({ pendingChanges: true })
		.where(eq(caddySyncState.id, STATE_ID))
		.run();
}

export async function markCaddySuccess() {
	const at = nowIso();
	await ensureStateRow();
	await getDb()
		.update(caddySyncState)
		.set({
			connected: true,
			lastError: null,
			lastAttemptAt: at,
			lastSuccessAt: at,
			pendingChanges: false,
		})
		.where(eq(caddySyncState.id, STATE_ID))
		.run();
}

export async function markCaddyFailure(error: string) {
	await ensureStateRow();
	await getDb()
		.update(caddySyncState)
		.set({
			connected: false,
			lastError: error,
			lastAttemptAt: nowIso(),
			pendingChanges: true,
		})
		.where(eq(caddySyncState.id, STATE_ID))
		.run();
}

export async function markCaddyfileManagedWrite(hash: string) {
	await ensureStateRow();
	await getDb()
		.update(caddySyncState)
		.set({
			lastManagedWriteAt: nowIso(),
			lastManagedWriteHash: hash,
		})
		.where(eq(caddySyncState.id, STATE_ID))
		.run();
}

export async function getCaddySyncSnapshot(): Promise<CaddySyncSnapshot> {
	const row = await readStateRow();
	const config = await getSiteConfig();
	const caddyApi = config?.caddyApi ?? "";

	return {
		connected: row?.connected ?? true,
		lastError: row?.lastError ?? null,
		lastAttemptAt: row?.lastAttemptAt ?? null,
		lastSuccessAt: row?.lastSuccessAt ?? null,
		pendingChanges: row?.pendingChanges ?? false,
		caddyApiUrl: caddyApi,
		lastManagedWriteAt: row?.lastManagedWriteAt ?? null,
		lastManagedWriteHash: row?.lastManagedWriteHash ?? null,
	};
}
