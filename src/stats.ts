import { getDb } from "./db";

export function statsCommand(): void {
  const db = getDb();

  const docs = (db.prepare(`SELECT COUNT(*) AS count FROM documents`).get() as any).count;
  const pkgs = (db.prepare(`SELECT COUNT(*) AS count FROM packages`).get() as any).count;
  const lics = (db.prepare(`SELECT COUNT(*) AS count FROM licenses`).get() as any).count;

  console.log(`\n  Documents : ${docs}`);
  console.log(`  Packages  : ${pkgs}`);
  console.log(`  Licenses  : ${lics}\n`);
}
