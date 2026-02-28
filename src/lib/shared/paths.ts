import path from "node:path";

function localDevPath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}

export function preferLocalPathInDev(
  dockerDefault: string,
  localRelative: string,
): string {
  if (process.env.NODE_ENV === "development") {
    return localDevPath(localRelative);
  }
  return dockerDefault;
}

export function getCaddyfilePath(): string {
  return (
    process.env.CADDYFILE_PATH ??
    preferLocalPathInDev("/app/Caddyfile", "Caddyfile")
  );
}
