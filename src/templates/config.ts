import pkgJson from "../../package.json";
import { TRANSFORM_MODULE_FILE_NAME } from "./transform-module";
import { TYPE_DECLARATION_FILE_NAME } from "./types";

export const CONFIG_FILE_NAME = `${pkgJson.aliasName}.config.ts`;
export const CONFIG_TEMPLATE = `import { defineConfig, sourceDB } from "${pkgJson.name}";
import "./${TYPE_DECLARATION_FILE_NAME}";

export default defineConfig({
  sourceSelectSQL: sourceDB,
  sourceTotalCountSQL: sourceDB
    .selectFrom("public.table_name")
    .select((eb) => eb.fn.countAll<number>().as("totalCount")),
  sourceIdField: "",
  targetTable: "",
  targetColumns: [],
  batchSize: 1000,
  // transformModule: "./${TRANSFORM_MODULE_FILE_NAME}",
  retry: 10,
  lastId: undefined,
});
`;
