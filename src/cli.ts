import { Command } from "commander";
import { ingestCommand } from "./ingest";
import { queryCommand } from "./query";
import { listCommand } from "./list";
import { statsCommand } from "./stats";
import { deleteCommand } from "./delete";

const program = new Command();

program
  .name("sbom-cli")
  .description("Ingest and query Software Bill of Materials (SBOMs)")
  .version("1.0.0", "-V, --ver");

program
  .command("ingest <file>")
  .description("Ingest a CycloneDX 1.6 JSON SBOM into the local database")
  .action(ingestCommand);

program
  .command("query")
  .description("Query ingested SBOMs by component or license")
  .option("--component <name>", "Search by component name")
  .option("--version <version>", "Filter by component version (requires --component)")
  .option("--license <license>", "Search by license")
  .action(queryCommand);

program
  .command("list")
  .description("List all ingested SBOM documents")
  .action(listCommand);

program
  .command("stats")
  .description("Show summary counts of documents, packages, and licenses")
  .action(statsCommand);

program
  .command("delete <id>")
  .description("Delete an ingested document by ID (cascades to packages and licenses)")
  .action(deleteCommand);

program.parse();
