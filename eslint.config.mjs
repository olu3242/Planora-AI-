import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";
import a11y from "eslint-plugin-jsx-a11y";
import globals from "globals";
import importPlugin from "eslint-plugin-import";
import nextPlugin from "@next/eslint-plugin-next";

const keyboardInteractionRule = {
  meta: { type: "problem", schema: [], messages: { keyboard: "Clickable non-interactive elements must also support keyboard activation." } },
  create(context) {
    return { JSXOpeningElement(node) {
      if (node.name.type !== "JSXIdentifier" || !["div", "span", "section", "article", "li"].includes(node.name.name)) return;
      const attrs = node.attributes.filter(attr => attr.type === "JSXAttribute");
      const has = name => attrs.some(attr => attr.name.name === name);
      if (has("onClick") && !["onKeyDown", "onKeyUp", "onKeyPress"].some(has)) context.report({ node, messageId: "keyboard" });
    } };
  }
};

// Evaluation candidate only. Do not promote until all baseline rule parity,
// Next.js-specific protections, and repository lint checks are certified.
export default defineConfig([
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    settings: { react: { version: "detect" } },
    plugins: {
      react,
      import: importPlugin,
      "@next/next": nextPlugin,
      planora: { rules: { "keyboard-interaction": keyboardInteractionRule } },
      "react-hooks": hooks,
      "jsx-a11y": a11y
    },
    rules: {
      ...react.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...hooks.configs.recommended.rules,
      ...a11y.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "import/no-anonymous-default-export": "warn",
      "planora/keyboard-interaction": "error"
    }
  },
  globalIgnores([".next/**", "coverage/**", "playwright-report/**", "test-results/**", "next-env.d.ts"])
]);
