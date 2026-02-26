import path from 'path';

function localDevPath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}

function preferLocalPathInDev(dockerDefault: string, localRelative: string): string {
  if (process.env.NODE_ENV === 'development') {
    return localDevPath(localRelative);
  }
  return dockerDefault;
}

export function getDbPath(): string {
  return process.env.DB_PATH ?? preferLocalPathInDev('/app/data/sites.db', 'data/sites.db');
}

export function getCaddyfilePath(): string {
  return process.env.CADDYFILE_PATH ?? preferLocalPathInDev('/app/Caddyfile', 'Caddyfile');
}
