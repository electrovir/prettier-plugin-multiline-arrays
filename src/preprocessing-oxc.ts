import {type Comment, type Node} from 'estree';
import {type Parser, type Plugin} from 'prettier';
import {
    type ActualParserOptions,
    addMultilinePrinter,
    isExternalPluginWithParser,
    removePlugin,
} from './preprocessing.js';
import {
    type CommentTriggers,
    isTriggerCommentText,
    parseCommentTriggers,
    setCommentTriggersForNode,
} from './printer/comment-triggers.js';

type NodeWithLocation = Partial<{
    declaration: Partial<{
        decorators: NodeWithLocation[];
    }>;
    decorators: NodeWithLocation[];
    end: number;
    range: [
        number,
        number,
    ];
    start: number;
}>;

type LineLocation = {
    column: number;
    line: number;
};

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

function oxcLocStart(node: NodeWithLocation): number {
    const firstDecorator = node.declaration?.decorators?.[0] ?? node.decorators?.[0];
    return firstDecorator ? oxcLocStart(firstDecorator) : (node.range?.[0] ?? node.start ?? 0);
}

function oxcLocEnd(node: NodeWithLocation): number {
    return node.range?.[1] ?? node.end ?? 0;
}

function createLocationFinder(text: string): (index: number) => LineLocation {
    const lineStartIndexes = [0];

    let characterIndex = 0;
    for (const character of text) {
        if (character === '\n') {
            lineStartIndexes.push(characterIndex + 1);
        }
        characterIndex += character.length;
    }

    return (characterIndex) => {
        let lowIndex = 0;
        let highIndex = lineStartIndexes.length - 1;

        while (lowIndex <= highIndex) {
            const middleIndex = Math.floor((lowIndex + highIndex) / 2);
            const lineStartIndex = lineStartIndexes[middleIndex];
            const nextLineStartIndex = lineStartIndexes[middleIndex + 1] ?? Infinity;

            if (lineStartIndex == undefined || characterIndex < lineStartIndex) {
                highIndex = middleIndex - 1;
            } else if (characterIndex >= nextLineStartIndex) {
                lowIndex = middleIndex + 1;
            } else {
                return {
                    column: characterIndex - lineStartIndex,
                    line: middleIndex + 1,
                };
            }
        }

        return {
            column: characterIndex,
            line: 1,
        };
    };
}

function addLocationsToAst(input: unknown, text: string): void {
    const getLocation = createLocationFinder(text);
    const visitedObjects = new WeakSet<object>();

    function addLocations(currentInput: unknown): void {
        if (!currentInput || typeof currentInput !== 'object' || visitedObjects.has(currentInput)) {
            return;
        }

        visitedObjects.add(currentInput);

        if (Array.isArray(currentInput)) {
            currentInput.forEach((entry) => addLocations(entry));
            return;
        }

        const currentNode = currentInput as NodeWithLocation & {
            loc?: {
                end: LineLocation;
                start: LineLocation;
            };
        };
        const hasLocation =
            !!currentNode.range || currentNode.start != undefined || currentNode.end != undefined;
        const start = oxcLocStart(currentNode);
        const end = oxcLocEnd(currentNode);

        if (hasLocation && !currentNode.loc && start >= 0 && end >= start) {
            currentNode.loc = {
                end: getLocation(end),
                start: getLocation(start),
            };
        }

        Object.entries(currentInput).forEach(
            ([
                key,
                value,
            ]) => {
                if (key !== 'loc') {
                    addLocations(value);
                }
            },
        );
    }

    addLocations(input);
}

function replaceWithLocationPreservingWhitespace(input: string): string {
    return input.replace(/[^\r\n]/g, ' ');
}

/**
 * `@prettier/plugin-oxc@0.1.4` can crash while attaching line comments in call arguments
 * (`isChildWontPrint` / `canAttachComment`). This plugin only needs its own trigger comments, so
 * scan those comments from raw text before oxc sees them and replace them with same-length
 * whitespace. That preserves line/column offsets for AST nodes while preventing oxc from trying to
 * attach comments that only this plugin consumes.
 *
 * This is deliberately not a general comment parser: ordinary comments are left in place so oxc can
 * keep handling them, and so upstream fixes naturally take effect.
 */
function sanitizeOxcTriggerComments(text: string): {
    comments: Comment[];
    text: string;
} {
    const comments: Comment[] = [];
    const replacements: {
        end: number;
        start: number;
    }[] = [];
    const getLocation = createLocationFinder(text);

    let characterIndex = 0;
    while (characterIndex < text.length) {
        const currentCharacter = text[characterIndex];
        const nextCharacter = text[characterIndex + 1];

        if (currentCharacter === '"' || currentCharacter === "'" || currentCharacter === '`') {
            const quoteCharacter = currentCharacter;
            characterIndex++;

            while (characterIndex < text.length) {
                const stringCharacter = text[characterIndex];

                if (stringCharacter === '\\') {
                    characterIndex += 2;
                } else if (stringCharacter === quoteCharacter) {
                    characterIndex++;
                    break;
                } else {
                    characterIndex++;
                }
            }
        } else if (currentCharacter === '/' && nextCharacter === '/') {
            const commentStart = characterIndex;
            const commentTextStart = characterIndex + 2;
            characterIndex = commentTextStart;

            while (
                characterIndex < text.length &&
                text[characterIndex] !== '\n' &&
                text[characterIndex] !== '\r'
            ) {
                characterIndex++;
            }

            const commentText = text.slice(commentTextStart, characterIndex);
            if (isTriggerCommentText(commentText)) {
                /** Replace the whole `// ...` span, but keep the newline after it intact. */
                replacements.push({
                    end: characterIndex,
                    start: commentStart,
                });
                comments.push({
                    loc: {
                        end: getLocation(characterIndex),
                        start: getLocation(commentStart),
                    },
                    type: 'Line',
                    value: commentText,
                });
            }
        } else if (currentCharacter === '/' && nextCharacter === '*') {
            const commentStart = characterIndex;
            const commentTextStart = characterIndex + 2;
            const commentTextEnd = text.indexOf('*/', commentTextStart);
            const commentEnd = commentTextEnd < 0 ? text.length : commentTextEnd + 2;
            const commentText = text.slice(
                commentTextStart,
                commentTextEnd < 0 ? text.length : commentTextEnd,
            );

            if (isTriggerCommentText(commentText)) {
                /** Block triggers may span lines; preserve any line breaks inside the block. */
                replacements.push({
                    end: commentEnd,
                    start: commentStart,
                });
                comments.push({
                    loc: {
                        end: getLocation(commentEnd),
                        start: getLocation(commentStart),
                    },
                    type: 'Block',
                    value: commentText,
                });
            }

            characterIndex = commentEnd;
        } else {
            characterIndex++;
        }
    }

    const sanitizedText = replacements.reduceRight((currentText, replacement) => {
        return [
            currentText.slice(0, replacement.start),
            replaceWithLocationPreservingWhitespace(
                currentText.slice(replacement.start, replacement.end),
            ),
            currentText.slice(replacement.end),
        ].join('');
    }, text);

    return {
        comments,
        text: sanitizedText,
    };
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
            const sanitizedInput = sanitizeOxcTriggerComments(text);
            const nextText =
                externalParser.preprocess?.(sanitizedInput.text, removePlugin(options)) ??
                sanitizedInput.text;
            const commentTriggers = parseCommentTriggers(sanitizedInput.comments, false);

            addMultilinePrinter(options);
            oxcPreprocessResults.set(options, {
                commentTriggers,
                text: nextText,
            });

            return nextText;
        },
    };
}
