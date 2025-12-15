import {defineEslintConfig} from '@virmator/lint/configs/eslint.config.base.mjs';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
    ...defineEslintConfig(__dirname),
    {
        ignores: [
            /** Add file globs that should be ignored. */
        ],
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
