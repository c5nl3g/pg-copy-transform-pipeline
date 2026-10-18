import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: ["dist"],
  sortImports: {
    newlinesBetween: false,
    groups: [
      ["value-builtin", "value-external"],
      ["value-internal", "value-parent", "value-sibling", "value-index"],
      { newlinesBetween: true },
      "type-import",
      "unknown",
    ],
  },
  sortPackageJson: {
    sortScripts: true,
  },
});
