import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import * as schema from "./schema";
import { getDbPath } from "~/lib/config/runtimePaths";

let _db: BetterSQLite3Database<typeof schema> | null = null;

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
