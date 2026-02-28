ALTER TABLE `site_config` ADD COLUMN `caddy_api` text NOT NULL DEFAULT 'http://host.docker.internal:2019';
