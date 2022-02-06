import {Config} from 'prettier';

const prettierConfig: Config = {
    overrides: [
        {
            files: [
                '*.ts',
                '*.js',
            ],
            options: {
                parser: 'multiline-arrays',
            },
        },
    ],
    printWidth: 100,
    singleQuote: true,
    tabWidth: 4,
};

module.exports = prettierConfig;
