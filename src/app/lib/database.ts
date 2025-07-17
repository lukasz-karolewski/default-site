import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export interface Redirect {
  id?: number;
  name: string;
  host: string;
  target: string;
  created_at?: string;
  updated_at?: string;
}

const DB_PATH = path.join(process.cwd(), 'data', 'redirects.db');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Initialize database schema
    initializeDatabase();
  }
  
  return db;
}

function initializeDatabase() {
  if (!db) return;

  // Create redirects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS redirects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      host TEXT NOT NULL UNIQUE,
      target TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create a trigger to update updated_at timestamp
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_redirects_timestamp 
    AFTER UPDATE ON redirects
    BEGIN
      UPDATE redirects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `);
}

export function getAllRedirects(): Redirect[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM redirects ORDER BY host');
  return stmt.all() as Redirect[];
}

export function getRedirectById(id: number): Redirect | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM redirects WHERE id = ?');
  return stmt.get(id) as Redirect | null;
}

export function createRedirect(redirect: Omit<Redirect, 'id' | 'created_at' | 'updated_at'>): Redirect {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO redirects (name, host, target) VALUES (?, ?, ?)');
  const result = stmt.run(redirect.name, redirect.host, redirect.target);
  
  return getRedirectById(result.lastInsertRowid as number)!;
}

export function updateRedirect(id: number, redirect: Partial<Redirect>): Redirect | null {
  const db = getDatabase();
  
  const updates: string[] = [];
  const values: (string | number)[] = [];
  
  if (redirect.name !== undefined) {
    updates.push('name = ?');
    values.push(redirect.name);
  }
  if (redirect.host !== undefined) {
    updates.push('host = ?');
    values.push(redirect.host);
  }
  if (redirect.target !== undefined) {
    updates.push('target = ?');
    values.push(redirect.target);
  }
  
  if (updates.length === 0) {
    return getRedirectById(id);
  }
  
  values.push(id);
  const stmt = db.prepare(`UPDATE redirects SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  
  return getRedirectById(id);
}

export function deleteRedirect(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM redirects WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}