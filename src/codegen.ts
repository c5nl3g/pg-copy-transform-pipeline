import { Kysely, PostgresDialect } from "kysely";
import {
  generate as kyselyGenerate,
  PostgresDialect as CodeGenPostgresDialect,
} from "kysely-codegen";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import pkgJson from "../package.json";

const MARKER = `// --- ${pkgJson.name} augmentation ---`;

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

function appendAugmentation(file: string, interfaceName: "SourceDB" | "TargetDB") {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes(MARKER)) return;

  const augmentation = `
${MARKER}
import "${pkgJson.name}"

declare module "${pkgJson.name}" {
    interface ${interfaceName} extends DB {}
}
`;
  fs.appendFileSync(file, augmentation, "utf8");
}

export async function generateTypes(options: {
  sourceDatabaseUrl: string;
  targetDatabaseUrl: string;
  outDir?: string;
}) {
  const outDir = path.resolve(options.outDir ?? process.cwd());
  fs.mkdirSync(outDir, { recursive: true });

  const sourceFile = path.join(outDir, "source-db.d.ts");
  const targetFile = path.join(outDir, "target-db.d.ts");

  console.log("generating source-db.d.ts ...");
  await runCodegen(options.sourceDatabaseUrl, sourceFile);
  appendAugmentation(sourceFile, "SourceDB");

  console.log("generating target-db.d.ts ...");
  await runCodegen(options.targetDatabaseUrl, targetFile);
  appendAugmentation(targetFile, "TargetDB");

  console.log(`DONE:\n  ${sourceFile}\n  ${targetFile}`);
}
