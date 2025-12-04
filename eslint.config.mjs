import {defineEslintConfig} from '@virmator/lint/configs/eslint.config.base.mjs';
import {dirname} from 'node:path';
import path from "node:path";
import {fileURLToPath} from 'node:url';

import tseslintParser from "@typescript-eslint/parser";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
    ...defineEslintConfig(__dirname),
    {
        ignores: [
            "eslint.config.mjs",
            "prettier.config.mjs",
            "scripts/format-file.mjs"
            /** Add file globs that should be ignored. */
        ],
        languageOptions: {
            parser: tseslintParser,
            parserOptions: {
                ecmaFeatures: {
                    impliedStrict: true
                },
                ecmaVersion: "latest",
                jsDocParsingMode: "all",
                project: "./tsconfig.json",
                sourceType: "module",
                tsconfigRootDir: path.resolve(import.meta.dirname),
                warnOnUnsupportedTypeScriptVersion: true,
            },
        },
    },
    {
        rules: {
            /**
             * Turn off or on specific rules. See {@link defineEslintConfig} for which plugins are
             * already enabled.
             */
        },
    },
];
