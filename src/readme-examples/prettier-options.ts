import {Config} from 'prettier';

const prettierConfig: Config = {
    plugins: [
        './node_modules/prettier-plugin-sort-json',
        './node_modules/prettier-plugin-packagejson',
        './node_modules/prettier-plugin-multiline-arrays', // plugin added here
        './node_modules/prettier-plugin-organize-imports',
        './node_modules/prettier-plugin-jsdoc',
    ],
    printWidth: 100,
    singleQuote: true,
    tabWidth: 4,
};

module.exports = prettierConfig;
