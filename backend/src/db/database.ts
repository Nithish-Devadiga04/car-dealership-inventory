import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export type DB = Database.Database;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    make       TEXT    NOT NULL,
    model      TEXT    NOT NULL,
    category   TEXT    NOT NULL,
    price      REAL    NOT NULL CHECK (price >= 0),
    quantity   INTEGER NOT NULL CHECK (quantity >= 0),
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_vehicles_make     ON vehicles (make);
  CREATE INDEX IF NOT EXISTS idx_vehicles_model    ON vehicles (model);
  CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles (category);
  CREATE INDEX IF NOT EXISTS idx_vehicles_price    ON vehicles (price);
`;

/**
 * Opens (and creates if needed) a file-backed SQLite database and applies the schema.
 * The CHECK constraints act as a last line of defence: quantity can never go negative.
 */
export function createDatabase(filename: string): DB {
  fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}
