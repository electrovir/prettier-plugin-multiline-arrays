import {getSupportInfo, Parser, ParserOptions, Plugin, Printer} from 'prettier';
import {parsers as tsParsers} from 'prettier/parser-typescript';
import {astFormatName, parserName} from './metadata/package-phrases';
import {setOriginalPrinter} from './printer/jsplugin';
import {multilineArrayPrinter} from './printer/multiline-array-printer';

const multilineArraysPlugin: Plugin = {
    languages: [
        {
            name: 'typescript',
            parsers: [
                parserName,
            ],
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

function addMultilinePrinter(options: ParserOptions): void {
    if ('printer' in options) {
        setOriginalPrinter((options as any as {printer: Printer}).printer);
        // overwrite the printer with ours
        (options as any as {printer: Printer}).printer = multilineArrayPrinter;
    } else {
        /** If the printer hasn't already been assigned in options, rearrange plugins so that ours gets chosen. */
        const plugins = options.plugins;
        const firstMatchedPlugin = plugins.find(
            (plugin): plugin is Plugin =>
                typeof plugin !== 'string' && !!plugin.printers && !!plugin.printers.estree,
        );
        if (!firstMatchedPlugin || typeof firstMatchedPlugin === 'string') {
            throw new Error(`Matched invalid first plugin: ${firstMatchedPlugin}`);
        }
        const matchedPrinter = firstMatchedPlugin.printers?.estree;
        if (!matchedPrinter) {
            throw new Error(`Printer not found on matched plugin: ${firstMatchedPlugin}`);
        }
        setOriginalPrinter(matchedPrinter);
        const thisPluginIndex = plugins.findIndex((plugin) => {
            return (plugin as any).pluginMarker === pluginMarker;
        });
        const thisPlugin = plugins[thisPluginIndex];
        if (!thisPlugin) {
            throw new Error(`This plugin was not found.`);
        }
        // remove this plugin from its current location in the array
        plugins.splice(thisPluginIndex, 1);
        // add this plugin to the beginning of the array so its printer is found first
        plugins.splice(0, 0, thisPlugin);
    }
}

const languages = getSupportInfo().languages.filter(({name}) =>
    [
        'JavaScript',
        'Flow',
        'JSX',
        'TSX',
        'TypeScript',
        'Markdown',
        'MDX',
    ].includes(name),
);

function findPluginsByParserName(parserName: string, options: ParserOptions): Plugin[] {
    return options.plugins.filter((plugin): plugin is Plugin => {
        return (
            typeof plugin === 'object' &&
            (plugin as any).pluginMarker !== pluginMarker &&
            !!plugin.parsers?.[parserName]
        );
    });
}

function mergeParsers(originalParser: Parser, parserName: string) {
    const thisPluginPreprocess = (text: string, options: ParserOptions) => {
        const pluginsWithPreprocessor = findPluginsByParserName(parserName, options).filter(
            (plugin) => !!plugin.parsers?.[parserName]?.preprocess,
        );

        let processedText = text;

        pluginsWithPreprocessor.forEach((pluginWithPreprocessor) => {
            const nextText = pluginWithPreprocessor.parsers?.[parserName]?.preprocess?.(
                processedText,
                {
                    ...options,
                    plugins: options.plugins.filter(
                        (plugin) => (plugin as any).pluginMarker !== pluginMarker,
                    ),
                },
            );
            if (nextText != undefined) {
                processedText = nextText;
            }
        });

        addMultilinePrinter(options);

        // Object.assign(parser, {
        //     ...parser,
        //     preprocess: thisPluginPreprocess,
        // });

        return processedText;
    };

    const parser = {
        ...originalParser,
        preprocess: thisPluginPreprocess,
    };

    return parser;
}
const typescriptParser = mergeParsers(tsParsers.typescript, 'typescript');

const pluginMarker = {};

const plugin: Plugin = {
    // used to ensuring tracking of this plugin later
    ...({pluginMarker: pluginMarker} as any),
    languages,
    parsers: {
        typescript: typescriptParser,
    },
    printers: {
        estree: multilineArrayPrinter,
    },
};

module.exports = plugin;
