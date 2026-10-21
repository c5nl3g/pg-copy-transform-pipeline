import path from "node:path";
import { createDebug } from "obug";
import { createConfigLoader } from "unconfig";
import pkgJson from "../package.json";
import { initTemplate } from "./templates";
import { CONFIG_FILE_NAME, CONFIG_TEMPLATE } from "./templates/config";
import {
  TRANSFORM_MODULE_FILE_NAME,
  TRANSFORM_MODULE_TEMPLATE,
} from "./templates/transform-module";

import type { PctpConfig } from "~/types";

const debug = createDebug(`${pkgJson.aliasName}:config`);

export function initConfig() {
  initTemplate(CONFIG_FILE_NAME, CONFIG_TEMPLATE);
}

export function initTransformModule() {
  initTemplate(TRANSFORM_MODULE_FILE_NAME, TRANSFORM_MODULE_TEMPLATE);
}

export function defineConfig(config: PctpConfig) {
  return config;
}

interface ResolveConfigOptions {
  configPath?: string;
}

export async function resolveConfig(options: ResolveConfigOptions = {}): Promise<PctpConfig> {
  const { configPath } = options;
  const absolutePath = configPath ? path.resolve(process.cwd(), configPath) : undefined;

  const loader = createConfigLoader<PctpConfig>({
    sources: [
      absolutePath
        ? {
            files: [path.basename(absolutePath)],
            extensions: [""],
          }
        : {
            files: [`${pkgJson.aliasName}.config`],
          },
    ],
    cwd: absolutePath ? path.dirname(absolutePath) : process.cwd(),
    merge: false,
  });

  const result = await loader.load();

  debug(result.config);

  return result.config;
}
