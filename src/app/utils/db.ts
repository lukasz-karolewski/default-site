import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import path from 'path';
import * as schema from './schema';

let _db: BetterSQLite3Database<typeof schema> | null = null;

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!_db) {
    const sqlite = new Database(process.env.DB_PATH ?? '/app/data/sites.db');
    _db = drizzle(sqlite, { schema });
    migrate(_db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  }
  return _db;
}
