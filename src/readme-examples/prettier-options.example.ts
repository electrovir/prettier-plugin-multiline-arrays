import {Config} from 'prettier';

const prettierConfig: Config = {
    plugins: [
        // relative paths are usually required so Prettier can find the plugin
        './node_modules/prettier-plugin-multiline-arrays', // plugin added here
    ],
    printWidth: 100,
    singleQuote: true,
    tabWidth: 4,
};

module.exports = prettierConfig;
