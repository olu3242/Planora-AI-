import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// Additive safeguard for mouse-only JSX. The candidate replacement must still
// pass the independent jsx-a11y rule parity gate before eslint-config-next is removed.
const keyboardInteractionRule = {
  meta: {
    type: "problem",
    docs: { description: "Require keyboard handling for clickable non-interactive elements" },
    schema: [],
    messages: {
      keyboard: "Clickable non-interactive elements must also support keyboard activation."
    }
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier") return;
        if (!["div", "span", "section", "article", "li"].includes(node.name.name)) return;
        const attrs = node.attributes.filter(attr => attr.type === "JSXAttribute");
        const has = name => attrs.some(attr => attr.name.name === name);
        if (has("onClick") && !["onKeyDown", "onKeyUp", "onKeyPress"].some(has)) {
          context.report({ node, messageId: "keyboard" });
        }
      }
    };
  }
};

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: { planora: { rules: { "keyboard-interaction": keyboardInteractionRule } } },
    rules: { "planora/keyboard-interaction": "error" }
  },
  globalIgnores([".next/**", "coverage/**", "playwright-report/**", "test-results/**", "next-env.d.ts"])
]);
