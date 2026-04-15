import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface NormalizedLicense {
  id?: string;
  name?: string;
  expression?: string;
}

export interface NormalizedPackage {
  name: string;
  version?: string;
  purl?: string;
  licenses: NormalizedLicense[];
}

export interface NormalizedSbom {
  document: {
    sourceFile: string;
    format: "cyclonedx";
    name?: string;
    specVersion?: string;
    contentHash: string;
  };
  packages: NormalizedPackage[];
}

export function parseCycloneDx(filePath: string): NormalizedSbom {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }

  const fileContent = fs.readFileSync(resolved, "utf-8");
  const contentHash = crypto.createHash("sha256").update(fileContent).digest("hex");
  const raw = JSON.parse(fileContent);

  if (raw.bomFormat !== "CycloneDX") {
    throw new Error(
      `Unsupported format: expected bomFormat "CycloneDX", got "${raw.bomFormat}".`
    );
  }

  const docName = raw.metadata?.component?.name ?? raw.metadata?.name;
  const components: unknown[] = raw.components ?? [];

  const packages: NormalizedPackage[] = components.map((c: any) => ({
    name: c.name,
    version: c.version,
    purl: c.purl,
    licenses: normalizeLicenses(c.licenses),
  }));

  return {
    document: {
      sourceFile: resolved,
      format: "cyclonedx",
      name: docName,
      specVersion: raw.specVersion,
      contentHash,
    },
    packages,
  };
}

function normalizeLicenses(raw: unknown[] | undefined): NormalizedLicense[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((entry: any) => {
    if (entry.expression) {
      return { expression: entry.expression };
    }
    const lic = entry.license;
    if (!lic) return {};
    return {
      id: lic.id,
      name: lic.name,
    };
  });
}
