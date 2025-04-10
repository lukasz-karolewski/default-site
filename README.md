# Default Site for Caddy Server

A clean, simple Next.js app that displays a list of sites configured in a Caddy server. This serves as a default landing page when accessing the IP address directly.

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

## License

MIT