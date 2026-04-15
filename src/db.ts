import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "sbom.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

export function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  return db;
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      source_file   TEXT NOT NULL,
      format        TEXT NOT NULL,
      doc_name      TEXT,
      spec_version  TEXT,
      content_hash  TEXT,
      ingested_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS packages (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id   INTEGER NOT NULL REFERENCES documents(id),
      name          TEXT NOT NULL,
      version       TEXT,
      purl          TEXT
    );

    CREATE TABLE IF NOT EXISTS licenses (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id      INTEGER NOT NULL REFERENCES packages(id),
      license_id      TEXT,
      license_name    TEXT,
      expression      TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name);
    CREATE INDEX IF NOT EXISTS idx_packages_name_version ON packages(name, version);
    CREATE INDEX IF NOT EXISTS idx_licenses_id ON licenses(license_id);
    CREATE INDEX IF NOT EXISTS idx_licenses_name ON licenses(license_name);
  `);
}
