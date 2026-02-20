# default-site

A self-hosted dashboard and Caddyfile manager for a homelab reverse proxy. It runs as a Docker container alongside Caddy, provides a UI for adding and removing subdomain routes, and writes a single wildcard-block Caddyfile that Caddy reloads live via its Admin API.

## How it works

All services live as subdomains under one domain (e.g. `ha.example.com`, `wg.example.com`). Caddy issues a single wildcard TLS certificate (`*.example.com` + `example.com`) via DNS challenge, which means every new subdomain you add is instantly covered — no per-service cert needed.

This app owns the Caddyfile. It stores your routes in a local SQLite database, and whenever you add or remove a site through the UI, it regenerates the Caddyfile and pushes it to Caddy's Admin API, which reloads configuration without dropping connections. The root domain (`example.com`) is always routed to this app itself.

Generated Caddyfile shape:

```
# Managed by default-site — do not edit manually.
# Use Caddyfile.custom for TLS, logging, and other options inside the site block.

*.example.com, example.com {
    import /app/Caddyfile.custom

    @ha host ha.example.com
    handle @ha {
        reverse_proxy localhost:8123
    }

    @wg host wg.example.com
    handle @wg {
        reverse_proxy localhost:8888
    }

    handle {
        reverse_proxy localhost:3080
    }
}
```

TLS configuration, logging, and any other Caddy directives that belong inside the site block go in `Caddyfile.custom`. That file is yours — it is never overwritten.

## Prerequisites

- **Caddy** with a DNS challenge plugin installed on the host (e.g. [`caddy-dns/route53`](https://github.com/caddy-dns/route53) for AWS Route 53)
- **Docker** and Docker Compose on the same host
- A domain with DNS managed by your chosen provider
- Caddy's Admin API enabled and reachable from the container (default: `localhost:2019`)

## Host Caddy setup

### 1. Install Caddy with your DNS plugin

Build or download Caddy with the DNS provider module for your registrar. With `xcaddy`:

```bash
xcaddy build --with github.com/caddy-dns/route53
```

### 2. Create `/etc/caddy/Caddyfile.custom`

This file is imported inside the wildcard block and is where you put TLS config, logging, and anything else. Create it before first run — if it does not exist, the app will create it with:

```
tls internal
log
```

Ensure this path is a regular file, not a directory:

```bash
ls -ld /etc/caddy/Caddyfile.custom
```

Example custom configuration:

```
tls {
    dns route53 {
        region us-east-1
    }
}

log
```

### 3. Enable the Caddy Admin API

In your global Caddy options block (before any site blocks), make sure the Admin API is listening on an address reachable from the container:

```
{
    admin 0.0.0.0:2019
}
```

Then validate and start Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl start caddy
sudo systemctl enable caddy
```

### 4. Grant write access to `/etc/caddy/Caddyfile`

The container mounts `/etc/caddy/Caddyfile` read-write. Caddy must be able to read it after the container writes it. The simplest approach is to make the file world-readable and owned by the caddy user:

```bash
sudo touch /etc/caddy/Caddyfile
sudo chown caddy:caddy /etc/caddy/Caddyfile
sudo chmod 664 /etc/caddy/Caddyfile
```

## Deployment

### 1. Clone the repository

```bash
git clone https://github.com/lukasz-karolewski/default-site.git
cd default-site
```

### 2. Configure `docker-compose.yml`

Set `BASE_DOMAIN` to your domain:

```yaml
environment:
  - BASE_DOMAIN=example.com
```

### 3. Start the container

```bash
docker compose up -d
```

Recommended preflight checks:

```bash
curl http://localhost:2019/config/
ls -l /etc/caddy/Caddyfile /etc/caddy/Caddyfile.custom
```

On first start, the app:
1. Checks whether the SQLite database already has sites.
2. If empty, parses existing routes from `/app/Caddyfile`.
3. Backs up `/app/Caddyfile` to `/app/Caddyfile.bak` (when present), then writes the generated Caddyfile and calls the Caddy Admin API to reload.

The dashboard is available at `http://<host>:3080` and, once Caddy reloads, at `https://example.com`.

### 4. Add your DNS wildcard record

Point `*.example.com` and `example.com` to your server's IP. Caddy will obtain the wildcard certificate automatically on first request (or on startup if you configured `tls` eagerly).

## Migrating from an existing Caddyfile

If you have an existing Caddyfile with named matchers in the format the app understands:

```
@ha host ha.example.com
reverse_proxy @ha localhost:8123
```

Place it at `/etc/caddy/Caddyfile` before starting the container. On first run, the app parses it, imports the sites into SQLite, then takes over management of the Caddyfile.

## Troubleshooting

### Docker mount error: `... /app/Caddyfile.custom ... not a directory`

This means host and container mount types do not match.

1. Ensure `/etc/caddy/Caddyfile.custom` is a file:

```bash
ls -ld /etc/caddy/Caddyfile.custom
```

2. If it is a directory, replace it with a file:

```bash
sudo mv /etc/caddy/Caddyfile.custom /etc/caddy/Caddyfile.custom.dir.bak
sudo touch /etc/caddy/Caddyfile.custom
sudo chown caddy:caddy /etc/caddy/Caddyfile.custom
sudo chmod 664 /etc/caddy/Caddyfile.custom
```

3. Recreate containers:

```bash
docker compose down --remove-orphans
docker compose up --force-recreate
```

### Startup crash: `ECONNREFUSED ... :2019` / `Failed to prepare server`

The app failed to reach Caddy Admin API during startup.

1. Check Caddy service status:

```bash
systemctl is-active caddy
systemctl status caddy --no-pager -n 40
```

2. Start Caddy if inactive:

```bash
sudo systemctl start caddy
```

3. Confirm API reachability:

```bash
curl http://localhost:2019/config/
```

4. Restart app container:

```bash
docker compose up --force-recreate
```

## Environment variables

| Variable            | Default                   | Description |
|---------------------|---------------------------|-------------|
| `BASE_DOMAIN`       | *(required)*              | Root domain for the wildcard block (e.g. `example.com`) |
| `CADDY_API`         | `http://localhost:2019`   | URL of the Caddy Admin API |
| `CADDY_CUSTOM_FILE` | `/app/Caddyfile.custom`   | Path to the custom config imported inside the wildcard block |
| `DASHBOARD_UPSTREAM`| `localhost:3080`          | Upstream for the root domain catchall (this app) |
| `CADDYFILE_PATH`    | `/app/Caddyfile`          | Path to the generated Caddyfile (must be volume-mounted to `/etc/caddy/Caddyfile`) |

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest
npm run build      # production build
```

For local development, `BASE_DOMAIN` must be set in your environment or a `.env.local` file:

```bash
BASE_DOMAIN=test.com npm run dev
```

## Architecture

```
Browser → UI (Next.js App Router)
           │
           ▼
      /api/sites (REST)
           │
           ▼
      SQLite (sites_data volume)
           │
           ▼
      generateCaddyfile()   ← reads BASE_DOMAIN, CADDY_CUSTOM_FILE
           │
           ├── writes /app/Caddyfile  (→ /etc/caddy/Caddyfile on host)
           │
           └── POST /load → Caddy Admin API  (live reload, no downtime)
```

## License

MIT
