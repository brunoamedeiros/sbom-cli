import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "./db";
import type Database from "better-sqlite3";

describe("database schema and operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("creates all three tables", () => {
    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);

    expect(names).toContain("documents");
    expect(names).toContain("packages");
    expect(names).toContain("licenses");
  });

  it("inserts and retrieves a document", () => {
    db.prepare(
      `INSERT INTO documents (source_file, format, doc_name, spec_version, content_hash, ingested_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run("test.json", "cyclonedx", "test-app", "1.6", "abc123", "2026-01-01T00:00:00Z");

    const row = db.prepare(`SELECT * FROM documents WHERE id = 1`).get() as any;
    expect(row.source_file).toBe("test.json");
    expect(row.doc_name).toBe("test-app");
    expect(row.content_hash).toBe("abc123");
  });

  it("enforces foreign key on packages", () => {
    expect(() => {
      db.prepare(
        `INSERT INTO packages (document_id, name, version) VALUES (999, 'test', '1.0')`
      ).run();
    }).toThrow();
  });

  it("supports full ingest and query roundtrip", () => {
    db.prepare(
      `INSERT INTO documents (source_file, format, doc_name, spec_version, content_hash, ingested_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run("test.json", "cyclonedx", "app", "1.6", "hash1", "2026-01-01T00:00:00Z");

    db.prepare(
      `INSERT INTO packages (document_id, name, version, purl) VALUES (1, 'lodash', '4.17.21', 'pkg:npm/lodash@4.17.21')`
    ).run();

    db.prepare(
      `INSERT INTO licenses (package_id, license_id, license_name, expression) VALUES (1, 'MIT', null, null)`
    ).run();

    const byComponent = db.prepare(
      `SELECT p.name, p.version FROM packages p WHERE p.name = ? COLLATE NOCASE`
    ).all("LODASH") as any[];
    expect(byComponent).toHaveLength(1);
    expect(byComponent[0].name).toBe("lodash");

    const byLicense = db.prepare(
      `SELECT l.license_id FROM licenses l WHERE l.license_id = ? COLLATE NOCASE`
    ).all("mit") as any[];
    expect(byLicense).toHaveLength(1);
    expect(byLicense[0].license_id).toBe("MIT");
  });

  it("detects duplicate documents by content_hash", () => {
    db.prepare(
      `INSERT INTO documents (source_file, format, doc_name, spec_version, content_hash, ingested_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run("a.json", "cyclonedx", "app", "1.6", "samehash", "2026-01-01T00:00:00Z");

    const existing = db.prepare(
      `SELECT id FROM documents WHERE content_hash = ?`
    ).get("samehash") as { id: number } | undefined;

    expect(existing).toBeDefined();
    expect(existing!.id).toBe(1);

    const missing = db.prepare(
      `SELECT id FROM documents WHERE content_hash = ?`
    ).get("differenthash");

    expect(missing).toBeUndefined();
  });

  it("cascade delete works manually", () => {
    db.prepare(
      `INSERT INTO documents (source_file, format, doc_name, spec_version, content_hash, ingested_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run("test.json", "cyclonedx", "app", "1.6", "hash1", "2026-01-01T00:00:00Z");

    db.prepare(`INSERT INTO packages (document_id, name, version) VALUES (1, 'pkg', '1.0')`).run();
    db.prepare(`INSERT INTO licenses (package_id, license_id) VALUES (1, 'MIT')`).run();

    db.prepare(`DELETE FROM licenses WHERE package_id IN (SELECT id FROM packages WHERE document_id = 1)`).run();
    db.prepare(`DELETE FROM packages WHERE document_id = 1`).run();
    db.prepare(`DELETE FROM documents WHERE id = 1`).run();

    const docs = (db.prepare(`SELECT COUNT(*) AS c FROM documents`).get() as any).c;
    const pkgs = (db.prepare(`SELECT COUNT(*) AS c FROM packages`).get() as any).c;
    const lics = (db.prepare(`SELECT COUNT(*) AS c FROM licenses`).get() as any).c;

    expect(docs).toBe(0);
    expect(pkgs).toBe(0);
    expect(lics).toBe(0);
  });
});
