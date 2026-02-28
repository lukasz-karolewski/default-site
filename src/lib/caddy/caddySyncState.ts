import { eq } from "drizzle-orm";
import { getDb } from "~/lib/data/db";
import { caddySyncState } from "~/lib/data/schema";
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

type MutableStateFields = Partial<
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

async function updateState(fields: MutableStateFields) {
  await ensureStateRow();
  await getDb()
    .update(caddySyncState)
    .set(fields)
    .where(eq(caddySyncState.id, STATE_ID))
    .run();
}

function nowIso() {
  return new Date().toISOString();
}

export async function markCaddyPending() {
  await updateState({ pendingChanges: true });
}

export async function markCaddySuccess() {
  const at = nowIso();
  await updateState({
    connected: true,
    lastError: null,
    lastAttemptAt: at,
    lastSuccessAt: at,
    pendingChanges: false,
  });
}

export async function markCaddyFailure(error: string) {
  await updateState({
    connected: false,
    lastError: error,
    lastAttemptAt: nowIso(),
    pendingChanges: true,
  });
}

export async function markCaddyfileManagedWrite(hash: string) {
  await updateState({
    lastManagedWriteAt: nowIso(),
    lastManagedWriteHash: hash,
  });
}

export async function getCaddySyncSnapshot(): Promise<CaddySyncSnapshot> {
  const row = await readStateRow();
  const config = await getSiteConfig();

  return {
    connected: row?.connected ?? true,
    lastError: row?.lastError ?? null,
    lastAttemptAt: row?.lastAttemptAt ?? null,
    lastSuccessAt: row?.lastSuccessAt ?? null,
    pendingChanges: row?.pendingChanges ?? false,
    caddyApiUrl: config?.caddyApi ?? "",
    lastManagedWriteAt: row?.lastManagedWriteAt ?? null,
    lastManagedWriteHash: row?.lastManagedWriteHash ?? null,
  };
}
