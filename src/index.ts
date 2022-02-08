import {getSupportInfo, Parser, Plugin} from 'prettier';
import {parsers as babelParsers} from 'prettier/parser-babel';
import {parsers as tsParsers} from 'prettier/parser-typescript';
import {pluginMarker} from './metadata/plugin-marker';
import {addCustomPreprocessing} from './preprocessing';
import {multilineArrayPrinter} from './printer/multiline-array-printer';

const languages = getSupportInfo().languages.filter(({name}) =>
    [
        'JavaScript',
        'TypeScript',
        'JSON',
        'JSON5',
        'JSON with Comments',
        'JSON.stringify',
    ].includes(name),
);

const parsers = Object.entries({
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

const plugin: Plugin = {
    // used to ensuring tracking of this plugin later
    ...({pluginMarker} as any),
    languages,
    parsers,
    printers: {
        estree: multilineArrayPrinter,
        'estree-json': multilineArrayPrinter,
    },
};

module.exports = plugin;
