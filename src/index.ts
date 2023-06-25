import {getObjectTypedKeys, mapObjectValues} from '@augment-vir/common';
import {
    BooleanSupportOption,
    IntSupportOption,
    Parser,
    Plugin,
    Printer,
    RequiredOptions,
    StringSupportOption,
    SupportLanguage,
    SupportOption,
    getSupportInfo,
} from 'prettier';
import {parsers as babelParsers} from 'prettier/parser-babel';
import {parsers as tsParsers} from 'prettier/parser-typescript';
import {MultilineArrayOptions, defaultMultilineArrayOptions, optionHelp} from './options';
import {wrapParser} from './preprocessing';
import {multilineArrayPrinter} from './printer/multiline-array-printer';

// exports in case others want to utilize these
export * from './options';
export {pluginMarker} from './plugin-marker';

export const languages: SupportLanguage[] = getSupportInfo().languages.filter(({name}) =>
    [
        'JavaScript',
        'TypeScript',
        'JSON',
        'JSON5',
        'JSON with Comments',
        'JSON.stringify',
    ].includes(name),
);

export const parsers: Record<string, Parser<any>> = mapObjectValues(
    {
        typescript: tsParsers.typescript,
        babel: babelParsers.babel,
        'babel-ts': babelParsers['babel-ts'],
        json: babelParsers.json,
        json5: babelParsers.json5,
    },
    (languageName, parserEntry) => {
        return wrapParser(parserEntry, languageName);
    },
);

export const printers: Record<string, Printer<any>> = {
    estree: multilineArrayPrinter,
    'estree-json': multilineArrayPrinter,
};

export const options: Record<keyof MultilineArrayOptions, SupportOption> = getObjectTypedKeys(
    defaultMultilineArrayOptions,
).reduce((accum, key) => {
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
    };
    accum[key] = supportOption;
    return accum;
}, {} as Record<keyof MultilineArrayOptions, SupportOption>);

export const defaultOptions: Partial<RequiredOptions> & Required<MultilineArrayOptions> =
    defaultMultilineArrayOptions;

/** Not actually exported. Just for type checking purposes. */
const plugin: Plugin = {
    options,
    printers,
    defaultOptions,
    parsers,
    languages,
};
