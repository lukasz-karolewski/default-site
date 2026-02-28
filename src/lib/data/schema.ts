import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sites = sqliteTable("sites", {
  id: text("id").primaryKey(),
  host: text("host").notNull(),
  upstream: text("upstream").notNull(),
  // Add more fields as needed (e.g., tls, etc.)
});

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
