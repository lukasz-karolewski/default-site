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

## Troubleshooting Caddy API Connectivity

If the app reports `fetch failed` when syncing with Caddy, verify the stored `caddyApi` value.

- `0.0.0.0` is a bind/listen address, not a routable client destination.
- From the app container, `http://0.0.0.0:2019` can fail with `ECONNREFUSED`.
- Use a reachable host endpoint instead, typically `http://host.docker.internal:2019` (Linux compose in this repo already sets `extra_hosts: host.docker.internal:host-gateway`).

Common failure pattern:

1. Caddyfile contains `admin 0.0.0.0:2019`.
2. Onboarding/import detects this and stores it as `caddyApi`.
3. App tries to call `http://0.0.0.0:2019/load` and sync fails.

Fix:

1. Update onboarding settings and set `caddyApi` to `http://host.docker.internal:2019` (or your host IP).
2. Retry sync from the dashboard.

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
