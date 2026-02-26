# default-site

A self-hosted dashboard and Caddyfile manager for a homelab reverse proxy.

## Overview

The app stores routes in SQLite and generates a managed Caddyfile. On first run it requires onboarding to set:

- `baseDomain`
- `caddyApi` URL
- `dashboardUpstream` (where the root domain routes)
- site block directives (for example `tls`, `log`, DNS challenge directives)

These values are stored in DB (`site_config`), not in environment variables or `Caddyfile.custom`.

## First Run

On first start, the app:

1. Creates onboarding draft config if missing.
2. Tries to parse existing routes from mounted Caddyfile.
3. Redirects `/` to `/onboarding` until setup is completed.
4. On completion, writes Caddyfile and attempts Caddy Admin API reload.
5. If reload fails, shows inline manual recovery commands.

## Deployment

### Docker compose

Required runtime values:

- `CADDYFILE_PATH` (default: `/app/Caddyfile`)
- `DB_PATH` (default: `/app/data/sites.db`)
- `CADDY_RETRY_SECONDS` (default: `10`)

No `BASE_DOMAIN`. No `Caddyfile.custom`.

### Volumes

- Mount host Caddyfile to `/app/Caddyfile`
- Mount app DB storage to `/app/data`

## Environment variables

| Variable              | Default                         | Description |
|-----------------------|---------------------------------|-------------|
| `CADDY_RETRY_SECONDS` | `10`                            | Retry interval when sync is pending |
| `CADDYFILE_PATH`      | `/app/Caddyfile`                | Path to generated Caddyfile |
| `DB_PATH`             | `/app/data/sites.db`            | SQLite database path |

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

## License

MIT
