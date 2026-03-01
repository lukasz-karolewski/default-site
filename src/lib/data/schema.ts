import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sites = sqliteTable("sites", {
  id: text("id").primaryKey(),
  subdomain: text("subdomain").notNull(),
  upstream: text("upstream").notNull(),
  favicon: text("favicon"),
});

export type SiteRecord = typeof sites.$inferSelect;

export const caddySyncState = sqliteTable("caddy_sync_state", {
  id: text("id").primaryKey(),
  connected: integer("connected", { mode: "boolean" }).notNull().default(true),
  lastError: text("last_error"),
  lastAttemptAt: text("last_attempt_at"),
  lastSuccessAt: text("last_success_at"),
  pendingChanges: integer("pending_changes", { mode: "boolean" })
    .notNull()
    .default(false),
  lastManagedWriteAt: text("last_managed_write_at"),
  lastManagedWriteHash: text("last_managed_write_hash"),
});

export type CaddySyncStateSnapshot = Omit<
  typeof caddySyncState.$inferSelect,
  "id"
>;

export const siteConfig = sqliteTable("site_config", {
  id: text("id").primaryKey(),
  baseDomain: text("base_domain").notNull(),
  caddyApi: text("caddy_api").notNull(),
  dashboardUpstream: text("dashboard_upstream").notNull(),
  siteBlockDirectives: text("site_block_directives").notNull(),
  onboardingStatus: text("onboarding_status", {
    enum: ["pending", "completed"],
  }).notNull(),
});

export type SiteConfigRecord = typeof siteConfig.$inferSelect;
export type SiteConfigInput = Omit<typeof siteConfig.$inferInsert, "id">;
