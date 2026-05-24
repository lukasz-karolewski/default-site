import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sites = sqliteTable("sites", {
  favicon: text("favicon"),
  id: text("id").primaryKey(),
  subdomain: text("subdomain").notNull(),
  upstream: text("upstream").notNull(),
});

export type SiteRecord = typeof sites.$inferSelect;

export const caddySyncState = sqliteTable("caddy_sync_state", {
  connected: integer("connected", { mode: "boolean" }).notNull().default(true),
  id: text("id").primaryKey(),
  lastAttemptAt: text("last_attempt_at"),
  lastError: text("last_error"),
  lastManagedWriteAt: text("last_managed_write_at"),
  lastManagedWriteHash: text("last_managed_write_hash"),
  lastSuccessAt: text("last_success_at"),
  pendingChanges: integer("pending_changes", { mode: "boolean" })
    .notNull()
    .default(false),
});

export type CaddySyncStateSnapshot = Omit<
  typeof caddySyncState.$inferSelect,
  "id"
>;

export const siteConfig = sqliteTable("site_config", {
  baseDomain: text("base_domain").notNull(),
  caddyApi: text("caddy_api").notNull(),
  dashboardUpstream: text("dashboard_upstream").notNull(),
  id: text("id").primaryKey(),
  onboardingStatus: text("onboarding_status", {
    enum: ["pending", "completed"],
  }).notNull(),
  siteBlockDirectives: text("site_block_directives").notNull(),
});

export type SiteConfigRecord = typeof siteConfig.$inferSelect;
export type SiteConfigInput = Omit<typeof siteConfig.$inferInsert, "id">;
