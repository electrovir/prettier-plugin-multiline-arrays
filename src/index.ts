import {Plugin} from 'prettier';
import {parsers as tsParsers} from 'prettier/parser-typescript';
import {astFormatName, parserName} from './metadata/package-phrases';
import {printer} from './printer/newline-printer';

const newlineArraysPlugin: Plugin = {
    languages: [
        {
            name: 'typescript',
            parsers: [parserName],
        },
    ],
    parsers: {
        [parserName]: {
            ...tsParsers['typescript'],
            astFormat: astFormatName,
        },
    },
    printers: {
        [astFormatName]: printer,
    },
};

module.exports = newlineArraysPlugin;
