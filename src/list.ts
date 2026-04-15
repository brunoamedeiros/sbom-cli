import path from "path";
import { getDb } from "./db";

interface DocRow {
  id: number;
  source_file: string;
  doc_name: string | null;
  spec_version: string | null;
  ingested_at: string;
  pkg_count: number;
}

export function listCommand(): void {
  const db = getDb();

  const rows = db.prepare(`
    SELECT d.id, d.source_file, d.doc_name, d.spec_version, d.ingested_at,
           COUNT(p.id) AS pkg_count
    FROM documents d
    LEFT JOIN packages p ON p.document_id = d.id
    GROUP BY d.id
    ORDER BY d.id
  `).all() as DocRow[];

  if (rows.length === 0) {
    console.log("No documents ingested yet.");
    return;
  }

  console.log(`\n  ${"ID".padEnd(5)} ${"Name".padEnd(20)} ${"File".padEnd(25)} ${"Packages".padEnd(10)} ${"Ingested At"}`);
  console.log(`  ${"--".padEnd(5)} ${"----".padEnd(20)} ${"----".padEnd(25)} ${"--------".padEnd(10)} ${"-----------"}`);

  for (const row of rows) {
    const file = path.basename(row.source_file);
    const name = (row.doc_name ?? "N/A").slice(0, 19);
    console.log(`  ${String(row.id).padEnd(5)} ${name.padEnd(20)} ${file.padEnd(25)} ${String(row.pkg_count).padEnd(10)} ${row.ingested_at}`);
  }

  console.log();
}
