# sbom-cli

A TypeScript CLI tool that ingests CycloneDX 1.6 JSON Software Bill of Materials (SBOMs) into a local SQLite database and queries them by component or license. It uses Commander for argument parsing, `better-sqlite3` for zero-config persistence, and `tsx` for direct TypeScript execution with no build step. Queries are case-insensitive, and duplicate files are detected via SHA-256 content hashing.

## Getting started

```bash
npm install
npm link

# Ingest an SBOM
sbom-cli ingest fixtures/sample-bom.json

# Query by component (case-insensitive)
sbom-cli query --component lodash
sbom-cli query --component lodash --version 4.17.21

# Query by license
sbom-cli query --license MIT

# List ingested documents
sbom-cli list

# Show summary counts
sbom-cli stats

# Delete a document by ID
sbom-cli delete 1

# Run tests
npm test
```

Run `sbom-cli --help` for full usage details.
