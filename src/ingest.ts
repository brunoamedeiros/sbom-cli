import { parseCycloneDx } from "./parser";
import { getDb } from "./db";

export function ingestCommand(file: string): void {
  let sbom;
  try {
    sbom = parseCycloneDx(file);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const db = getDb();

  const existing = db.prepare(
    `SELECT id FROM documents WHERE content_hash = ?`
  ).get(sbom.document.contentHash) as { id: number } | undefined;

  if (existing) {
    console.log(`Skipped: this SBOM has already been ingested (document id ${existing.id}).`);
    return;
  }

  const insertDoc = db.prepare(
    `INSERT INTO documents (source_file, format, doc_name, spec_version, content_hash, ingested_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const insertPkg = db.prepare(
    `INSERT INTO packages (document_id, name, version, purl)
     VALUES (?, ?, ?, ?)`
  );

  const insertLicense = db.prepare(
    `INSERT INTO licenses (package_id, license_id, license_name, expression)
     VALUES (?, ?, ?, ?)`
  );

  const transaction = db.transaction(() => {
    const docResult = insertDoc.run(
      sbom.document.sourceFile,
      sbom.document.format,
      sbom.document.name ?? null,
      sbom.document.specVersion ?? null,
      sbom.document.contentHash,
      new Date().toISOString()
    );
    const docId = docResult.lastInsertRowid;

    let packageCount = 0;
    let licenseCount = 0;

    for (const pkg of sbom.packages) {
      const pkgResult = insertPkg.run(docId, pkg.name, pkg.version ?? null, pkg.purl ?? null);
      const pkgId = pkgResult.lastInsertRowid;
      packageCount++;

      for (const lic of pkg.licenses) {
        insertLicense.run(pkgId, lic.id ?? null, lic.name ?? null, lic.expression ?? null);
        licenseCount++;
      }
    }

    return { packageCount, licenseCount };
  });

  const { packageCount, licenseCount } = transaction();
  console.log(`Ingested 1 document, ${packageCount} packages, ${licenseCount} license records.`);
}
