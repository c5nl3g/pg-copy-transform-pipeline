import "dotenv/config";
import cac from "cac";
import { Effect } from "effect";
import pkgJson from "../package.json";
import { generateTypes } from "./codegen";
import { mainEffect } from "./main";
import { CONFIG_FILE_NAME } from "./templates/config";
import { initConfig, initTransformModule, resolveConfig } from "~/config";

const cli = cac(pkgJson.aliasName);

cli.option("--config [config]", "Config file", {
  default: CONFIG_FILE_NAME,
});

cli
  .command("init", "Generate DB types and create config.ts in the current directory")
  .option("--type-out-dir [dir]", "Output directory", { default: "." })
  .action(async (options) => {
    if (!process.env.SOURCE_DATABASE_URL || !process.env.TARGET_DATABASE_URL) {
      console.error("Please configure SOURCE_DATABASE_URL and TARGET_DATABASE_URL in env");
      process.exit(1);
    }

    await generateTypes({
      sourceDatabaseUrl: process.env.SOURCE_DATABASE_URL,
      targetDatabaseUrl: process.env.TARGET_DATABASE_URL,
      outDir: options.typeOutDir,
    });

    initConfig();
    initTransformModule();
  });

cli.command("start", "Start copy and transform").action(async () => {
  if (!process.env.SOURCE_DATABASE_URL || !process.env.TARGET_DATABASE_URL) {
    console.error("Please configure SOURCE_DATABASE_URL and TARGET_DATABASE_URL in env");
    process.exit(1);
  }

  const resolved = await resolveConfig();
  if (!resolved) {
    console.error(
      `Error: No configuration found. Run \`${pkgJson.aliasName} init\` to get started.`,
    );
    process.exit(1);
  }
  console.log(resolved);

  await Effect.runPromise(
    mainEffect({
      ...resolved,
      sourceDatabaseUrl: process.env.SOURCE_DATABASE_URL,
      targetDatabaseUrl: process.env.TARGET_DATABASE_URL,
    }),
  );

  process.exit(0);
});

cli.help();
cli.version(pkgJson.version);

cli.parse();
