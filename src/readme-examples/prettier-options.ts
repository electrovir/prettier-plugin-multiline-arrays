import {Config} from 'prettier';

const prettierConfig: Config = {
    plugins: [
        'prettier-plugin-organize-imports',
        'prettier-plugin-sort-json',
        'prettier-plugin-multiline-arrays',
    ],
    printWidth: 100,
    singleQuote: true,
    tabWidth: 4,
};

module.exports = prettierConfig;
