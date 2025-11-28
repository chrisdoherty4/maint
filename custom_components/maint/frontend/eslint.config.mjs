import { FlatCompat } from "@eslint/eslintrc";
import eslintJs from "@eslint/js";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({
  baseDirectory: fileURLToPath(new URL(".", import.meta.url)),
  recommendedConfig: eslintJs.configs.recommended,
  allConfig: eslintJs.configs.all
});

export default [
  {
    ignores: ["dist", "node_modules"]
  },
  ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:lit/recommended", "prettier"),
  {
    name: "maint-custom-rules",
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    }
  }
];
