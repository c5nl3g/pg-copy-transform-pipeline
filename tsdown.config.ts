import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["src/index", "src/cli"],
    define: {
      __TRANSFORM_WORKER_URL__: JSON.stringify("./workers/transform/index.mjs"),
    },
    dts: true,
    exports: true,
  },
  {
    entry: ["src/workers/transform/index"],
    outDir: "dist/workers/transform",
  },
]);
