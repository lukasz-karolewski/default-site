import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import {
  type BetterSQLite3Database,
  drizzle,
} from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { preferLocalPathInDev } from "../shared/paths";
import * as schema from "./schema";

let _db: BetterSQLite3Database<typeof schema> | null = null;

export function getDbPath(): string {
  return (
    process.env.DB_PATH ??
    preferLocalPathInDev("/app/data/sites.db", "data/sites.db")
  );
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!_db) {
    const dbPath = getDbPath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const sqlite = new Database(dbPath);
    _db = drizzle(sqlite, { schema });
    migrate(_db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  }
  return _db;
}
