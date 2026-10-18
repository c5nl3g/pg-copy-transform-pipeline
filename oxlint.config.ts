import { recommended as effectRecommended } from "@effect/tsgo/oxlint-presets";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [effectRecommended],
  plugins: ["typescript", "unicorn", "oxc", "effecttsgo"],
  ignorePatterns: ["dist"],
  categories: {
    correctness: "error",
  },
  rules: {},
  env: {
    builtin: true,
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
});
