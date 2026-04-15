import path from "path";

type ResultRow = Record<string, unknown>;

export function formatResults(rows: ResultRow[], queryType: "component" | "license"): void {
  console.log(`\nFound ${rows.length} result(s):\n`);

  for (const row of rows) {
    const file = typeof row.source_file === "string"
      ? path.basename(row.source_file)
      : "N/A";

    console.log(`  Document : ${file}`);
    if (row.doc_name) {
      console.log(`  SBOM Name: ${row.doc_name}`);
    }
    console.log(`  Package  : ${row.name ?? "N/A"}`);
    console.log(`  Version  : ${row.version ?? "N/A"}`);

    if (row.purl) {
      console.log(`  PURL     : ${row.purl}`);
    }

    if (queryType === "license") {
      const license = row.license_id ?? row.license_name ?? row.expression ?? "N/A";
      console.log(`  License  : ${license}`);
    }

    console.log();
  }
}
