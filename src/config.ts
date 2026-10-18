import { createDebug } from "obug";
import { createConfigLoader } from "unconfig";
import pkgJson from "../package.json";
import { initTemplate } from "./templates";
import { CONFIG_FILE_NAME, CONFIG_TEMPLATE } from "./templates/config";
import {
  TRANSFORM_MODULE_FILE_NAME,
  TRANSFORM_MODULE_TEMPLATE,
} from "./templates/transform-module";

import type { Config } from "~/types";

const debug = createDebug(`${pkgJson.aliasName}:config`);

export function initConfig() {
  initTemplate(CONFIG_FILE_NAME, CONFIG_TEMPLATE);
}

export function initTransformModule() {
  initTemplate(TRANSFORM_MODULE_FILE_NAME, TRANSFORM_MODULE_TEMPLATE);
}

export function defineConfig(config: Config) {
  return config;
}

export async function resolveConfig(): Promise<Config> {
  const loader = createConfigLoader<Config>({
    sources: [
      {
        files: [`${pkgJson.aliasName}.config`],
      },
    ],
    cwd: process.cwd(),
    merge: false,
  });

  const config = await loader.load();

  debug(config);

  return config.config;
}
