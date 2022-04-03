import {getObjectTypedKeys} from 'augment-vir';
import {
    getSupportInfo,
    Parser,
    Plugin,
    Printer,
    RequiredOptions,
    SupportLanguage,
    SupportOption,
} from 'prettier';
import {parsers as babelParsers} from 'prettier/parser-babel';
import {parsers as tsParsers} from 'prettier/parser-typescript';
import {defaultMultilineArrayOptions, MultilineArrayOptions, optionHelp} from './options';
import {addCustomPreprocessing} from './preprocessing';
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

export const parsers: Record<string, Parser<any>> = Object.entries({
    typescript: tsParsers.typescript,
    babel: babelParsers.babel,
    'babel-ts': babelParsers['babel-ts'],
    json: babelParsers.json,
    json5: babelParsers.json5,
}).reduce(
    (
        accum,
        [
            key,
            entry,
        ],
    ) => {
        accum[key] = addCustomPreprocessing(entry, key);
        return accum;
    },
    {} as Record<string, Parser>,
);

export const printers: Record<string, Printer<any>> = {
    estree: multilineArrayPrinter,
    'estree-json': multilineArrayPrinter,
};

export const options: Record<keyof MultilineArrayOptions, SupportOption> = getObjectTypedKeys(
    defaultMultilineArrayOptions,
).reduce((accum, key) => {
    const defaultValue = defaultMultilineArrayOptions[key];
    const supportOption: SupportOption = {
        name: key,
        type:
            typeof defaultValue === 'number'
                ? 'int'
                : // prettier's types are wrong here, 'string' is expected
                  (typeof defaultValue as any),
        category: 'multilineArray',
        since: '0.0.1',
        default: Array.isArray(defaultValue) ? defaultValue.join(' ') : (defaultValue as any),
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
