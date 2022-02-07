import {Config} from 'prettier';

const prettierConfig: Config = {
    plugins: [
        'prettier-plugin-organize-imports',
        'prettier-plugin-multiline-arrays', // plugin added here
        'prettier-plugin-sort-json',
    ],
    printWidth: 100,
    singleQuote: true,
    tabWidth: 4,
};

module.exports = prettierConfig;
