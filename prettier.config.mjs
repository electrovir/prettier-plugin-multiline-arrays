import {basePrettierConfig} from '@virmator/format/configs/prettier.config.base.mjs';

/**
 * @typedef {import('prettier-plugin-multiline-arrays').MultilineArrayOptions} MultilineOptions
 *
 * @typedef {import('prettier').Options} PrettierOptions
 * @type {PrettierOptions & MultilineOptions}
 */
const prettierConfig = {
    ...basePrettierConfig,
    /**
     * Ensure tests use the local plugin implementation from this repo rather than any
     * globally-installed or parent-folder copies.
     */
    plugins: basePrettierConfig.plugins.map((plugin) =>
        plugin === 'prettier-plugin-multiline-arrays'
            ? new URL('./dist/index.js', import.meta.url).href
            : plugin),
    multilineArraysWrapThreshold: -1,
};

export default prettierConfig;
