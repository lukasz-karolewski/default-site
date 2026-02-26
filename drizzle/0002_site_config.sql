CREATE TABLE `site_config` (
  `id` text PRIMARY KEY NOT NULL,
  `base_domain` text NOT NULL,
  `site_block_directives` text NOT NULL,
  `onboarding_status` text NOT NULL
);
