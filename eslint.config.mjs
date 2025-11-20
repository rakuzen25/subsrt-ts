import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import jestPlugin from "eslint-plugin-jest";
import regexpPlugin from "eslint-plugin-regexp";
import tsdocPlugin from "eslint-plugin-tsdoc";
import globals from "globals";
import { configs, parser } from "typescript-eslint";

export default defineConfig(
    js.configs.recommended,
    importPlugin.flatConfigs.recommended,
    importPlugin.flatConfigs.typescript,
    regexpPlugin.configs["flat/recommended"],
    prettierConfig,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.node,
                ...globals.es2017,
                ...globals.es2020,
            },
            parserOptions: {
                project: "./tsconfig.eslint.json",
            },
        },
        plugins: {
            tsdoc: tsdocPlugin,
        },
        settings: {
            "import/parsers": {
                "@typescript-eslint/parser": [".ts", ".tsx"],
            },
            "import/resolver": {
                typescript: {
                    alwaysTryTypes: true,
                    project: "./tsconfig.eslint.json",
                },
            },
        },
        rules: {
            curly: "error",
            "dot-notation": "error",
            eqeqeq: "error",
            "no-else-return": "error",
            "no-empty": ["error", { allowEmptyCatch: true }],
            "no-extra-bind": "error",
            "no-labels": "error",
            "no-lone-blocks": "error",
            "no-loop-func": "error",
            "no-new-func": "error",
            "no-new-object": "error",
            "no-new-wrappers": "error",
            "no-param-reassign": "error",
            "no-redeclare": "error",
            "no-template-curly-in-string": "error",
            "no-unreachable": "error",
            "no-useless-constructor": "error",
            "prefer-arrow-callback": "error",
            "prefer-exponentiation-operator": "error",
            "prefer-template": "error",
            quotes: ["error", "double", { avoidEscape: true }],
            "regexp/no-super-linear-backtracking": "warn",
            "require-atomic-updates": "error",
            "require-await": "error",
            "sort-imports": ["error", { ignoreCase: true, ignoreDeclarationSort: true }],
            "tsdoc/syntax": "warn",
            "import/order": [
                "error",
                {
                    alphabetize: { caseInsensitive: true, order: "asc" },
                    groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
                    "newlines-between": "always",
                },
            ],
        },
    },
    {
        files: ["**/*.ts"],
        extends: [...configs.recommendedTypeChecked, ...configs.stylisticTypeChecked],
        languageOptions: {
            parser,
            parserOptions: {
                project: "./tsconfig.eslint.json",
            },
        },
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "all",
                    argsIgnorePattern: "^_",
                    caughtErrors: "all",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                    varsIgnorePattern: "^_",
                },
            ],
        },
    },
    {
        files: ["test/*.test.ts"],
        plugins: {
            jest: jestPlugin,
        },
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
        rules: {
            ...jestPlugin.configs["flat/recommended"].rules,
            ...jestPlugin.configs["flat/style"].rules,
        },
    },
    {
        ignores: ["dist", ".DS_Store", "pnpm-lock.yaml"],
    },
);
