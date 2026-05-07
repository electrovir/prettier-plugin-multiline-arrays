import {type Node} from 'estree';
import {type Parser, type Plugin} from 'prettier';
import {
    type ActualParserOptions,
    addMultilinePrinter,
    isExternalPluginWithParser,
    removePlugin,
} from './preprocessing.js';
import {addLocationsToAst, oxcLocEnd, oxcLocStart} from './preprocessing/oxc-locations.js';
import {collectOxcTriggerComments} from './preprocessing/oxc-trigger-comments.js';
import {
    type CommentTriggers,
    parseCommentTriggers,
    setCommentTriggersForNode,
} from './printer/comment-triggers.js';

type OxcPreprocessResult = {
    commentTriggers: CommentTriggers;
    text: string;
};

/**
 * Prettier calls `preprocess` before `parse`, but only the AST reaches the printer. Keep the
 * trigger metadata here so the oxc path can avoid relying on comments attached by
 * `@prettier/plugin-oxc`.
 */
const oxcPreprocessResults = new WeakMap<object, OxcPreprocessResult>();

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

            const preprocessResult = oxcPreprocessResults.get(options);
            if (
                preprocessResult &&
                preprocessResult.text === text &&
                ast &&
                typeof ast === 'object'
            ) {
                /**
                 * Depending on the external parser shape, Prettier may use either the wrapper AST
                 * or its `program` child as the root seen by the printer. Cache on both when
                 * possible so `getCommentTriggers` does not fall back to AST comment crawling.
                 */
                setCommentTriggersForNode(ast as Node, preprocessResult.commentTriggers);

                const program = (ast as {program?: unknown}).program;
                if (program && typeof program === 'object') {
                    setCommentTriggersForNode(program as Node, preprocessResult.commentTriggers);
                }
            }

            return ast;
        },
        preprocess(text, options: ActualParserOptions) {
            const externalParser = getExternalParser(parserName, options);
            /**
             * Run external preprocessors before scanning trigger comments. Plugins like
             * `@ianvs/prettier-plugin-sort-imports` can rewrite imports and shift line numbers, so
             * trigger metadata must be based on the exact text that oxc will parse.
             */
            const nextText = externalParser.preprocess?.(text, removePlugin(options)) ?? text;
            const commentTriggers = parseCommentTriggers(
                collectOxcTriggerComments(nextText),
                false,
            );

            addMultilinePrinter(options);
            oxcPreprocessResults.set(options, {
                commentTriggers,
                text: nextText,
            });

            return nextText;
        },
    };
}
