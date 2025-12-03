import {stringify} from '@augment-vir/common';
import {type Parser, type ParserOptions, type Plugin, type Printer} from 'prettier';
import {createWrappedMultiTargetProxy} from 'proxy-vir';
import {type SetOptional} from 'type-fest';
import {pluginMarker} from './plugin-marker.js';
import {multilineArrayPrinter} from './printer/multiline-array-printer.js';
import {setOriginalPrinter} from './printer/original-printer.js';

/** Prettier's type definitions are not true. */
type ActualParserOptions = SetOptional<ParserOptions, 'plugins'> &
    Partial<{
        astFormat: string;
        printer: Printer;
    }>;

function addMultilinePrinter(options: ActualParserOptions): void {
    if ('printer' in options) {
        setOriginalPrinter(options.printer);
        // overwrite the printer with ours
        options.printer = multilineArrayPrinter;
    } else {
        const astFormat = options.astFormat;
        if (!astFormat) {
            throw new Error(`Could not find astFormat while adding printer.`);
        }
        /**
         * If the printer hasn't already been assigned in options, rearrange plugins so that ours
         * gets chosen.
         */
        const plugins = options.plugins ?? [];
        const firstMatchedPlugin = plugins.find(
            (plugin): plugin is Plugin =>
                typeof plugin !== 'string' &&
                !(plugin instanceof URL) &&
                !!plugin.printers &&
                !!plugin.printers[astFormat],
        );
        if (!firstMatchedPlugin || typeof firstMatchedPlugin === 'string') {
            throw new Error(`Matched invalid first plugin: ${firstMatchedPlugin}`);
        }
        const matchedPrinter = firstMatchedPlugin.printers?.[astFormat];
        if (!matchedPrinter) {
            throw new Error(
                `Printer not found on matched plugin: ${stringify(firstMatchedPlugin)}`,
            );
        }
        setOriginalPrinter(matchedPrinter);
        const thisPluginIndex = plugins.findIndex((plugin) => {
            return (plugin as {pluginMarker: any}).pluginMarker === pluginMarker;
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

function findPluginsByParserName(parserName: string, plugins: (Plugin | URL | string)[]): Plugin[] {
    return plugins.filter((plugin): plugin is Plugin => {
        return (
            typeof plugin === 'object' &&
            !(plugin instanceof URL) &&
            (plugin as {pluginMarker: any}).pluginMarker !== pluginMarker &&
            !!plugin.parsers?.[parserName]
        );
    });
}

export function wrapParser(originalParser: Parser, parserName: string) {
    /** Create a multi-target proxy of parsers so that we don't block other plugins. */
    const parserProxy = createWrappedMultiTargetProxy<Parser>({
        initialTarget: originalParser,
    });

    function multilineArraysPluginPreprocess(text: string, options: ActualParserOptions) {
        const pluginsFromOptions = options.plugins ?? [];
        const pluginsWithRelevantParsers = findPluginsByParserName(parserName, pluginsFromOptions);
        pluginsWithRelevantParsers.forEach((plugin) => {
            const currentParser = plugin.parsers?.[parserName];
            if (
                currentParser &&
                (plugin as {name?: string | undefined} | undefined)?.name?.includes(
                    'prettier-plugin-sort-json',
                )
            ) {
                parserProxy.proxyModifier.addOverrideTarget(currentParser);
            }
        });

        const pluginsWithPreprocessor = pluginsWithRelevantParsers.filter(
            (plugin) => !!plugin.parsers?.[parserName]?.preprocess,
        );

        let processedText = text;

        pluginsWithPreprocessor.forEach((pluginWithPreprocessor) => {
            const nextText = pluginWithPreprocessor.parsers?.[parserName]?.preprocess?.(
                processedText,
                {
                    ...options,
                    plugins: pluginsFromOptions.filter(
                        (plugin) => (plugin as {pluginMarker: any}).pluginMarker !== pluginMarker,
                    ),
                },
            );
            if (nextText != undefined) {
                processedText = nextText;
            }
        });

        addMultilinePrinter(options);

        return processedText;
    }

    parserProxy.proxyModifier.addOverrideTarget({
        preprocess: multilineArraysPluginPreprocess,
    });

    return parserProxy.proxy;
}
