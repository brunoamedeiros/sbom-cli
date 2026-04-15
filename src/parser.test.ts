import { describe, it, expect } from "vitest";
import { parseCycloneDx } from "./parser";
import path from "path";

const FIXTURE = path.join(__dirname, "..", "fixtures", "sample-bom.json");

describe("parseCycloneDx", () => {
  it("parses the fixture file and returns normalized data", () => {
    const result = parseCycloneDx(FIXTURE);

    expect(result.document.format).toBe("cyclonedx");
    expect(result.document.name).toBe("my-web-app");
    expect(result.document.specVersion).toBe("1.6");
    expect(result.document.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.packages).toHaveLength(5);
  });

  it("extracts package names and versions correctly", () => {
    const result = parseCycloneDx(FIXTURE);
    const lodash = result.packages.find((p) => p.name === "lodash");

    expect(lodash).toBeDefined();
    expect(lodash!.version).toBe("4.17.21");
    expect(lodash!.purl).toBe("pkg:npm/lodash@4.17.21");
  });

  it("normalizes license id entries", () => {
    const result = parseCycloneDx(FIXTURE);
    const lodash = result.packages.find((p) => p.name === "lodash")!;

    expect(lodash.licenses).toHaveLength(1);
    expect(lodash.licenses[0].id).toBe("MIT");
  });

  it("normalizes license name entries", () => {
    const result = parseCycloneDx(FIXTURE);
    const pg = result.packages.find((p) => p.name === "pg")!;

    expect(pg.licenses).toHaveLength(2);
    expect(pg.licenses[1].name).toBe("PostgreSQL License");
  });

  it("normalizes license expression entries", () => {
    const result = parseCycloneDx(FIXTURE);
    const commons = result.packages.find((p) => p.name === "apache-commons-lang")!;

    expect(commons.licenses).toHaveLength(1);
    expect(commons.licenses[0].expression).toBe("Apache-2.0 OR MIT");
  });

  it("throws on missing file", () => {
    expect(() => parseCycloneDx("nonexistent.json")).toThrow("File not found");
  });

  it("throws on non-CycloneDX file", () => {
    const tmpFile = path.join(__dirname, "..", "fixtures", "__test_bad.json");
    const fs = require("fs");
    fs.writeFileSync(tmpFile, JSON.stringify({ bomFormat: "SPDX" }));
    try {
      expect(() => parseCycloneDx(tmpFile)).toThrow("Unsupported format");
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});
