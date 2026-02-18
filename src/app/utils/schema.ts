import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const sites = sqliteTable('sites', {
  id: text('id').primaryKey(),
  host: text('host').notNull(),
  upstream: text('upstream').notNull(),
  // Add more fields as needed (e.g., tls, etc.)
});
