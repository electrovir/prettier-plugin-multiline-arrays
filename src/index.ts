import {Parser, Plugin} from 'prettier';
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

function addMultilinePreprocessor(parser: Parser): Parser {
    return {
        ...parser,
        preprocess: (code, options): string => {
            const originalPreprocessing = parser.preprocess
                ? parser.preprocess(code, options)
                : code;
            console.log({code, options});

            // return originalPreprocessing;
            return originalPreprocessing.replace(/\[\s*\n?/g, '[\n/* WHAT */\n');
        },
    };
}

const thingie = [
    /* what 
    is here */
    'a',
    'b',
];
// throw new Error(
//     'new idea: insert comments into array in preprocess of new parser, remove comment afterwards in a post processing phase that we have to add somehow',
// );

console.log('is this getting fired?');

// module.exports = multilineArraysPlugin;
module.exports = {
    parsers: {
        typescript: addMultilinePreprocessor(tsParsers.typescript),
    },
};
