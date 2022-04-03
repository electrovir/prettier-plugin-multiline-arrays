const fs = require('fs');
const path = require('path');

// the ordering of plugins here is VERY IMPORTANT
const plugins = [
    'prettier-plugin-sort-json',
    'prettier-plugin-packagejson',
    // "dist" below represents "prettier-plugin-multiline-arrays"
    './dist/',
    'prettier-plugin-organize-imports',
    'prettier-plugin-jsdoc',
].map((pluginName) => {
    if (pluginName.startsWith('.')) {
        return pluginName;
    }
    // account for installations where deps are flattened and installations where they're nested
    const defaultPath = `./node_modules/${pluginName}`;
    if (fs.existsSync(path.resolve(__dirname, defaultPath))) {
        return defaultPath;
    } else {
        return `./node_modules/virmator/node_modules/${pluginName}`;
    }
});

/**
 * @typedef {import('prettier-plugin-multiline-arrays').MultilineArrayOptions} MultilineOptions
 *
 * @typedef {import('prettier').Options} PrettierOptions
 * @type {PrettierOptions & MultilineOptions}
 */
const prettierConfig = {
    arrowParens: 'always',
    bracketSpacing: false,
    endOfLine: 'lf',
    htmlWhitespaceSensitivity: 'ignore',
    jsonRecursiveSort: true,
    bracketSameLine: false,
    plugins,
    printWidth: 100,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
};

module.exports = prettierConfig;
