const fs = require('fs');
const path = require('path');

const plugins = [
    'prettier-plugin-sort-json',
    'prettier-plugin-packagejson',
    'prettier-plugin-organize-imports',
    'prettier-plugin-jsdoc',
].map((pluginName) => {
    const defaultPath = `./node_modules/${pluginName}`;
    if (fs.existsSync(path.resolve(__dirname, defaultPath))) {
        return defaultPath;
    } else {
        return `./node_modules/virmator/node_modules/${pluginName}`;
    }
});

module.exports = {
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
