import pkgJson from "../../package.json";

export const TRANSFORM_MODULE_FILE_NAME = `${pkgJson.name}-transform-module.ts`;
export const TRANSFORM_MODULE_TEMPLATE = `import type { TransformFunction } from "${pkgJson.name}";

const transform: TransformFunction = (input) => {
  return {
    ...input,
  };
};

export default transform;
`;
