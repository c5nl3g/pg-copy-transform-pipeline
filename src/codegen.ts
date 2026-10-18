import { Kysely, PostgresDialect } from "kysely";
import {
  generate as kyselyGenerate,
  PostgresDialect as CodeGenPostgresDialect,
} from "kysely-codegen";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { initTemplate } from "./templates";
import {
  TYPE_DECLARATION_FILE_NAME,
  TYPE_DECLARATION_SOURCE_DB_FILE_NAME,
  TYPE_DECLARATION_TARGET_DB_FILE_NAME,
  TYPE_DECLARATION_TEMPLATE,
} from "./templates/types";

async function runCodegen(url: string, outFile: string) {
  const db = new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: url }),
    }),
  });

  try {
    await kyselyGenerate({
      db,
      dialect: new CodeGenPostgresDialect(),
      outFile,
    });
  } finally {
    await db.destroy();
  }
}

export function initDeclarationFile() {
  initTemplate(TYPE_DECLARATION_FILE_NAME, TYPE_DECLARATION_TEMPLATE);
}

export async function generateTypes(options: {
  sourceDatabaseUrl: string;
  targetDatabaseUrl: string;
  outDir?: string;
}) {
  const outDir = path.resolve(options.outDir ?? process.cwd());
  fs.mkdirSync(outDir, { recursive: true });

  const sourceFile = path.join(outDir, TYPE_DECLARATION_SOURCE_DB_FILE_NAME);
  const targetFile = path.join(outDir, TYPE_DECLARATION_TARGET_DB_FILE_NAME);

  console.log(`generating ${TYPE_DECLARATION_SOURCE_DB_FILE_NAME}...`);
  await runCodegen(options.sourceDatabaseUrl, sourceFile);

  console.log(`generating ${TYPE_DECLARATION_TARGET_DB_FILE_NAME}...`);
  await runCodegen(options.targetDatabaseUrl, targetFile);

  console.log(`generating declaration file...`);
  initDeclarationFile();

  console.log(`DONE:\n  ${sourceFile}\n  ${targetFile}`);
}
