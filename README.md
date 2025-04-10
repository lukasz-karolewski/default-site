# Default Site for Caddy Server

A clean, simple Next.js app that displays a list of sites configured in a Caddy server. This serves as a default landing page when accessing the IP address directly.

## Context

This application is designed to work with a Caddy server setup that provides HTTPS for locally deployed services that are only accessible from the local network. The Caddy configuration uses the [wildcard certificates pattern](https://caddyserver.com/docs/caddyfile/patterns#wildcard-certificates) and obtains certificates through the Route53 DNS module for automated certificate management.

This setup allows you to:
- Access local services via secure HTTPS connections
- Use real domain names with valid SSL certificates in your local environment
- Provide a clean landing page that lists all available services

## Features

- Reads the Caddyfile mounted in the container
- Automatically discovers and displays all hosts configured in Caddy
- Clean, responsive interface with direct links to all sites
- Built with Next.js App Router and Tailwind CSS
- Server-side rendering for optimal performance

## Docker Setup

The application runs in a Docker container and requires access to the Caddy configuration file.

```bash
# Clone the repository
git clone https://github.com/lukasz-karolewski/default-site.git
cd default-site

# Build and run with Docker Compose
docker-compose up -d
```

The app will be available at http://localhost:3080

## Configuration

The Docker configuration:
- Mounts the Caddyfile as read-only at the root of the application
- Exposes port 3080 to avoid conflicts with other services
- Uses a multi-stage build process for optimized container size

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

## How It Works

The application scans the Caddyfile looking for lines starting with `@` that contain a `host` directive. It extracts the hostname and displays them as clickable links.

Example Caddyfile pattern it recognizes:
```
@name host example.com
```

### Caddy Configuration Example

This app is designed to work with a Caddy setup similar to:

```
{
    # Use Route53 for DNS challenges with wildcard certificates
    acme_dns route53 {
        region us-east-1
    }
}

# Default site that shows all available services
:80, :443 {
    respond "Default site"
}

# Example of a service definition that this app will detect
@ha host ha.example.com
handle @ha {
    reverse_proxy homeassistant:8123
}

@dashboard host dashboard.example.com
handle @dashboard {
    reverse_proxy grafana:3000
}
```

The app will find `ha.example.com` and `dashboard.example.com` from this configuration and display them as clickable links.

## License

MIT