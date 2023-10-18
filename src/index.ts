import {getObjectTypedKeys, mapObjectValues} from '@augment-vir/common';
import {
    BooleanSupportOption,
    IntSupportOption,
    Parser,
    Plugin,
    Printer,
    RequiredOptions,
    StringSupportOption,
    SupportOption,
} from 'prettier';
import {parsers as tsParsers} from 'prettier/parser-typescript';
import {parsers as babelParsers} from 'prettier/plugins/babel';
import {MultilineArrayOptions, defaultMultilineArrayOptions, optionHelp} from './options';
import {wrapParser} from './preprocessing';
import {multilineArrayPrinter} from './printer/multiline-array-printer';

// exports in case others want to utilize these
export * from './options';
export {pluginMarker} from './plugin-marker';

const parsers: Record<string, Parser<any>> = mapObjectValues(
    {
        typescript: tsParsers.typescript,
        babel: babelParsers.babel,
        'babel-ts': babelParsers['babel-ts'],
        json: babelParsers.json,
        json5: babelParsers.json5,
    },
    (languageName, parserEntry) => {
        return wrapParser(parserEntry as any, languageName);
    },
);

const printers: Record<string, Printer<any>> = {
    estree: multilineArrayPrinter,
    'estree-json': multilineArrayPrinter,
};

const options: Record<keyof MultilineArrayOptions, SupportOption> = getObjectTypedKeys(
    defaultMultilineArrayOptions,
).reduce(
    (accum, key) => {
        const defaultValue = defaultMultilineArrayOptions[key];
        const supportOption: StringSupportOption | IntSupportOption | BooleanSupportOption = {
            name: key,
            type: (typeof defaultValue === 'number' ? 'int' : typeof defaultValue) as
                | 'string'
                | 'boolean'
                | 'int',
            category: 'multilineArray',
            since: '0.0.1',
            default: defaultValue as any,
            description: optionHelp[key],
        } as any;
        accum[key] = supportOption;
        return accum;
    },
    {} as Record<keyof MultilineArrayOptions, SupportOption>,
);

const defaultOptions: Partial<RequiredOptions> & Required<MultilineArrayOptions> =
    defaultMultilineArrayOptions;

const languages = [
    {
        name: 'JavaScript',
        parsers: [
            'babel',
            'acorn',
            'espree',
            'meriyah',
            'babel-flow',
            'babel-ts',
            'flow',
            'typescript',
        ],
    },
    {name: 'TypeScript', parsers: ['typescript', 'babel-ts']},
    {name: 'JSON.stringify', parsers: ['json-stringify']},
    {name: 'JSON', parsers: ['json']},
    {name: 'JSON with Comments', parsers: ['json']},
    {name: 'JSON5', parsers: ['json5']},
];

const plugin: Plugin = {
    options,
    printers,
    defaultOptions,
    parsers,
    languages,
};

export {defaultOptions, options, parsers};
