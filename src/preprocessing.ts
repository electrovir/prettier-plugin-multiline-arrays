import {check, checkWrap} from '@augment-vir/assert';
import {type MaybePromise, stringify} from '@augment-vir/common';
import {type Parser, type ParserOptions, type Plugin, type Printer} from 'prettier';
import {createWrappedMultiTargetProxy} from 'proxy-vir';
import {type SetOptional} from 'type-fest';
import {envDebugKey} from './options.js';
import {pluginMarker} from './plugin-marker.js';

/** Prettier's type definitions are not true. */
type ActualParserOptions = SetOptional<ParserOptions, 'plugins'> &
    Partial<{
        astFormat: string;
        printer: Printer;
    }>;

function addMultilinePrinter(options: ActualParserOptions): void {
    const astFormat = options.astFormat;
    if (!astFormat) {
        throw new Error(`Could not find astFormat while adding printer.`);
    }

    /**
     * Ensure this plugin appears before any other plugin that also provides a printer for the
     * current astFormat. This makes Prettier pick our printers when resolving the printer plugin,
     * while still letting Prettier fully normalize the printer object (including getVisitorKeys and
     * embed front‑matter support).
     */
    const plugins = options.plugins ?? [];
    const thisPluginIndex = plugins.findIndex((plugin) => {
        return checkWrap.isObject(plugin)?.pluginMarker === pluginMarker;
    });

    const firstMatchedPlugin = plugins.find(
        (plugin, index): plugin is Plugin =>
            index !== thisPluginIndex &&
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
        throw new Error(`Printer not found on matched plugin: ${stringify(firstMatchedPlugin)}`);
    }

    const thisPlugin = plugins[thisPluginIndex];
    if (!thisPlugin) {
        throw new Error(`This plugin was not found.`);
    }

    if (thisPluginIndex <= 0) {
        /** Already the first plugin; nothing else to do. */
        return;
    }

    /** Remove this plugin from its current location in the array. */
    plugins.splice(thisPluginIndex, 1);
    /** Add this plugin to the beginning of the array so its printer is found first. */
    plugins.splice(0, 0, thisPlugin);
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

    if (process.env[envDebugKey]) {
        console.info('[multiline-arrays] wrapParser active for parser:', parserName);
    }

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

        const receivedPromise = false as boolean;

        const nextTexts: MaybePromise<string | undefined>[] = [];

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
            nextTexts.push(nextText);
            if (check.isPromiseLike(nextText)) {
                nextTexts.push(nextText);
            }
        });

        if (receivedPromise) {
            // eslint-disable-next-line @typescript-eslint/await-thenable
            return Promise.all(nextTexts).then((awaitedNextTexts) => {
                awaitedNextTexts.forEach((nextText) => {
                    if (nextText != undefined) {
                        processedText = nextText;
                    }
                });
                addMultilinePrinter(options);

                return processedText;
            });
        } else {
            nextTexts.forEach((nextText) => {
                if (nextText != undefined) {
                    processedText = nextText as string;
                }
            });
            addMultilinePrinter(options);

            return processedText;
        }
    }

    parserProxy.proxyModifier.addOverrideTarget({
        preprocess: multilineArraysPluginPreprocess,
    });

    return parserProxy.proxy;
}
