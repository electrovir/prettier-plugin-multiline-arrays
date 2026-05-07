import {type Parser, type Plugin} from 'prettier';
import {
    type ActualParserOptions,
    addMultilinePrinter,
    isExternalPluginWithParser,
    removePlugin,
} from './preprocessing.js';
import {addLocationsToAst, oxcLocEnd, oxcLocStart} from './preprocessing/oxc-locations.js';

function findLastPluginByParserName(
    parserName: string,
    plugins: (Plugin | URL | string)[],
): Plugin | undefined {
    for (const plugin of plugins.slice().reverse()) {
        if (isExternalPluginWithParser(plugin, parserName)) {
            return plugin;
        }
    }

    return undefined;
}

function getExternalParser(parserName: string, options: ActualParserOptions): Parser {
    const externalParser = findLastPluginByParserName(parserName, options.plugins ?? [])?.parsers?.[
        parserName
    ];

    if (!externalParser) {
        throw new Error(
            `Parser "${parserName}" requires another plugin that provides it, such as @prettier/plugin-oxc.`,
        );
    }

    return externalParser;
}

export function wrapOxcParser(parserName: string): Parser {
    return {
        astFormat: 'estree-oxc',
        locStart: oxcLocStart,
        locEnd: oxcLocEnd,
        async parse(text, options) {
            const ast = await getExternalParser(parserName, options).parse(
                text,
                removePlugin(options),
            );

            addLocationsToAst(ast, text);

            return ast;
        },
        preprocess(text, options: ActualParserOptions) {
            const externalParser = getExternalParser(parserName, options);
            /**
             * Run external preprocessors first. Plugins like `@ianvs/prettier-plugin-sort-imports`
             * can rewrite imports and shift line numbers, so oxc should parse the exact text that
             * reaches the printer.
             */
            const nextText = externalParser.preprocess?.(text, removePlugin(options)) ?? text;

            addMultilinePrinter(options);

            return nextText;
        },
    };
}
