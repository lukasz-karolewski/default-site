CREATE TABLE `caddy_sync_state` (
  `id` text PRIMARY KEY NOT NULL,
  `connected` integer NOT NULL DEFAULT 1,
  `last_error` text,
  `last_attempt_at` text,
  `last_success_at` text,
  `pending_changes` integer NOT NULL DEFAULT 0,
  `last_managed_write_at` text,
  `last_managed_write_hash` text
);
