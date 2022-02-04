import {Plugin} from 'prettier';
import {parsers as tsParsers} from 'prettier/parser-typescript';
import {astFormatName, parserName} from './metadata/package-phrases';
import {multilineArrayPrinter} from './printer/multiline-array-printer';

const multilineArraysPlugin: Plugin = {
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
        [astFormatName]: multilineArrayPrinter,
    },
};

module.exports = multilineArraysPlugin;
