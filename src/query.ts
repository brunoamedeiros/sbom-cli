import { getDb } from "./db";
import { formatResults } from "./output";

interface QueryOptions {
  component?: string;
  version?: string;
  license?: string;
}

export function queryCommand(options: QueryOptions): void {
  if (!options.component && !options.license) {
    console.error("Error: provide either --component or --license.");
    process.exit(1);
  }

  if (options.version && !options.component) {
    console.error("Error: --version requires --component.");
    process.exit(1);
  }

  if (options.component && options.license) {
    console.error("Error: provide --component or --license, not both.");
    process.exit(1);
  }

  const db = getDb();

  if (options.component) {
    queryByComponent(db, options.component, options.version);
  } else {
    queryByLicense(db, options.license!);
  }
}

function queryByComponent(db: ReturnType<typeof getDb>, name: string, version?: string): void {
  const sql = version
    ? `SELECT d.source_file, d.doc_name, p.name, p.version, p.purl
       FROM packages p
       JOIN documents d ON d.id = p.document_id
       WHERE p.name = ? COLLATE NOCASE AND p.version = ?`
    : `SELECT d.source_file, d.doc_name, p.name, p.version, p.purl
       FROM packages p
       JOIN documents d ON d.id = p.document_id
       WHERE p.name = ? COLLATE NOCASE`;

  const rows = version
    ? db.prepare(sql).all(name, version)
    : db.prepare(sql).all(name);

  if (rows.length === 0) {
    console.log("No matches found.");
    return;
  }

  formatResults(rows as Record<string, unknown>[], "component");
}

function queryByLicense(db: ReturnType<typeof getDb>, license: string): void {
  const sql = `
    SELECT d.source_file, d.doc_name, p.name, p.version,
           l.license_id, l.license_name, l.expression
    FROM licenses l
    JOIN packages p ON p.id = l.package_id
    JOIN documents d ON d.id = p.document_id
    WHERE l.license_id = ? COLLATE NOCASE
       OR l.license_name = ? COLLATE NOCASE
       OR l.expression LIKE ? COLLATE NOCASE`;

  const rows = db.prepare(sql).all(license, license, `%${license}%`);

  if (rows.length === 0) {
    console.log("No matches found.");
    return;
  }

  formatResults(rows as Record<string, unknown>[], "license");
}
