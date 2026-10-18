import pkgJson from "../../package.json";

export const TYPE_DECLARATION_FILE_NAME = `${pkgJson.aliasName}.d.ts`;
export const TYPE_DECLARATION_SOURCE_DB_FILE_NAME = "source-db.d.ts";
export const TYPE_DECLARATION_TARGET_DB_FILE_NAME = "target-db.d.ts";

export const TYPE_DECLARATION_TEMPLATE = `
import "${pkgJson.name}";
import type { DB as SourceDBSchema } from "./${TYPE_DECLARATION_SOURCE_DB_FILE_NAME}";
import type { DB as TargetDBSchema } from "./${TYPE_DECLARATION_TARGET_DB_FILE_NAME}";

declare module "${pkgJson.name}" {
    interface SourceDB extends SourceDBSchema {}
    interface TargetDB extends TargetDBSchema {}
}
`;
