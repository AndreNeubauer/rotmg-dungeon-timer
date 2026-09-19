import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/", "dungeons.js", "wr-times.js", "playwright-report/", "test-results/"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        DUNGEON_CATALOG: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: ["app.js"],
    languageOptions: {
      sourceType: "module",
    },
  },
  {
    files: ["tests/**/*.js"],
    rules: {
      "no-empty-pattern": "off",
    },
  },
];
