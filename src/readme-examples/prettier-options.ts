import {Config} from 'prettier';

const prettierConfig: Config = {
    plugins: [
        'prettier-plugin-sort-json',
        'prettier-plugin-packagejson',
        'prettier-plugin-multiline-arrays', // plugin added here
        'prettier-plugin-organize-imports',
        'prettier-plugin-jsdoc',
    ],
    printWidth: 100,
    singleQuote: true,
    tabWidth: 4,
};

module.exports = prettierConfig;
