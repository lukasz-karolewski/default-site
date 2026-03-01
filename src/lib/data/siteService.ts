import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import type { CaddySyncStateSnapshot } from "./schema";
import { caddySyncState, sites } from "./schema";

export type { CaddySyncStateSnapshot };

const CADDY_SYNC_STATE_ID = "singleton";

type MutableCaddySyncStateFields = Partial<
  Pick<
    typeof caddySyncState.$inferInsert,
    | "connected"
    | "lastError"
    | "lastAttemptAt"
    | "lastSuccessAt"
    | "pendingChanges"
    | "lastManagedWriteAt"
    | "lastManagedWriteHash"
  >
>;

async function ensureCaddySyncStateRow() {
  await getDb()
    .insert(caddySyncState)
    .values({
      id: CADDY_SYNC_STATE_ID,
      connected: true,
      pendingChanges: false,
    })
    .onConflictDoNothing({ target: caddySyncState.id })
    .run();
}

async function readCaddySyncStateRow() {
  await ensureCaddySyncStateRow();
  return getDb()
    .select()
    .from(caddySyncState)
    .where(eq(caddySyncState.id, CADDY_SYNC_STATE_ID))
    .get();
}

async function updateCaddySyncState(fields: MutableCaddySyncStateFields) {
  await ensureCaddySyncStateRow();
  await getDb()
    .update(caddySyncState)
    .set(fields)
    .where(eq(caddySyncState.id, CADDY_SYNC_STATE_ID))
    .run();
}

function nowIso() {
  return new Date().toISOString();
}

export async function addSite(
  subdomain: string,
  upstream: string,
  favicon?: string | null,
) {
  return getDb()
    .insert(sites)
    .values({ id: randomUUID(), subdomain, upstream, favicon: favicon ?? null })
    .run();
}

export async function getSites() {
  return getDb().select().from(sites).all();
}

export async function removeSite(id: string) {
  return getDb().delete(sites).where(eq(sites.id, id)).run();
}

export async function updateSite(
  id: string,
  subdomain: string,
  upstream: string,
  favicon?: string | null,
) {
  return getDb()
    .update(sites)
    .set({ subdomain, upstream, favicon: favicon ?? null })
    .where(eq(sites.id, id))
    .run();
}

export async function markCaddyPending() {
  await updateCaddySyncState({ pendingChanges: true });
}

export async function markCaddySuccess() {
  const at = nowIso();
  await updateCaddySyncState({
    connected: true,
    lastError: null,
    lastAttemptAt: at,
    lastSuccessAt: at,
    pendingChanges: false,
  });
}

export async function markCaddyFailure(error: string) {
  await updateCaddySyncState({
    connected: false,
    lastError: error,
    lastAttemptAt: nowIso(),
    pendingChanges: true,
  });
}

export async function markCaddyfileManagedWrite(hash: string) {
  await updateCaddySyncState({
    lastManagedWriteAt: nowIso(),
    lastManagedWriteHash: hash,
  });
}

export async function getCaddySyncStateSnapshot(): Promise<CaddySyncStateSnapshot> {
  const row = await readCaddySyncStateRow();

  return {
    connected: row?.connected ?? true,
    lastError: row?.lastError ?? null,
    lastAttemptAt: row?.lastAttemptAt ?? null,
    lastSuccessAt: row?.lastSuccessAt ?? null,
    pendingChanges: row?.pendingChanges ?? false,
    lastManagedWriteAt: row?.lastManagedWriteAt ?? null,
    lastManagedWriteHash: row?.lastManagedWriteHash ?? null,
  };
}
