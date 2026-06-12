import js from "@eslint/js";
import { createRequire } from "node:module";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
const require = createRequire(import.meta.url);
const nextPlugin = require("@next/eslint-plugin-next");

export default [
    {
        ignores: ["**/.next/**", "**/node_modules/**", "**/public/**", "**/dist/**", "**/*.tsbuildinfo"],
    },
    js.configs.recommended,
    reactPlugin.configs.flat.recommended,
    {
        plugins: {
            "react-hooks": hooksPlugin,
            "jsx-a11y": jsxA11yPlugin,
            "@next/next": nextPlugin,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            ...hooksPlugin.configs.recommended.rules,
            ...jsxA11yPlugin.configs.recommended.rules,
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs["core-web-vitals"].rules,
        }
    },
    prettierConfig,
    {
        rules: {
            "sort-imports": ["warn", {
                ignoreCase: true,
                ignoreDeclarationSort: true,
                ignoreMemberSort: false,
                memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
            }],
            "no-unused-vars": "warn",
            "react/no-unescaped-entities": "off",
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@next/next/no-img-element": "off",
            "@next/next/no-html-link-for-pages": "off",
        },
    }
];