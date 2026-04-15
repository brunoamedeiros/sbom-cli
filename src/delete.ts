import { getDb } from "./db";

export function deleteCommand(id: string): void {
  const docId = parseInt(id, 10);
  if (isNaN(docId)) {
    console.error("Error: document ID must be a number.");
    process.exit(1);
  }

  const db = getDb();

  const doc = db.prepare(`SELECT id, source_file FROM documents WHERE id = ?`).get(docId) as
    | { id: number; source_file: string }
    | undefined;

  if (!doc) {
    console.error(`Error: no document found with id ${docId}.`);
    process.exit(1);
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      DELETE FROM licenses WHERE package_id IN (
        SELECT id FROM packages WHERE document_id = ?
      )
    `).run(docId);

    db.prepare(`DELETE FROM packages WHERE document_id = ?`).run(docId);
    db.prepare(`DELETE FROM documents WHERE id = ?`).run(docId);
  });

  transaction();
  console.log(`Deleted document ${docId} and its associated packages/licenses.`);
}
