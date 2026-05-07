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
    setCommentTriggersForOptions,
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

function addRangeToComment<T extends Comment>(comment: T, start: number, end: number): T {
    return Object.assign(comment, {
        end,
        range: [
            start,
            end,
        ],
        start,
    });
}

/**
 * `@prettier/plugin-oxc@0.1.4` can crash while attaching line comments in call arguments
 * (`isChildWontPrint` / `canAttachComment`). The printer wrapper guards that hook; this scan keeps
 * trigger metadata independent from oxc's comment attachment.
 *
 * This is deliberately not a general comment parser: ordinary comments are left to oxc, and so
 * upstream fixes naturally take effect.
 */
function sanitizeOxcTriggerComments(text: string): {
    comments: Comment[];
    text: string;
} {
    const comments: Comment[] = [];
    const getLocation = createLocationFinder(text);

    function skipQuotedString(characterIndex: number, quoteCharacter: string): number {
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

        return characterIndex;
    }

    function scanLineComment(characterIndex: number): number {
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
            comments.push(
                addRangeToComment(
                    {
                        loc: {
                            end: getLocation(characterIndex),
                            start: getLocation(commentStart),
                        },
                        type: 'Line',
                        value: commentText,
                    },
                    commentStart,
                    characterIndex,
                ),
            );
        }

        return characterIndex;
    }

    function scanBlockComment(characterIndex: number): number {
        const commentStart = characterIndex;
        const commentTextStart = characterIndex + 2;
        const commentTextEnd = text.indexOf('*/', commentTextStart);
        const commentEnd = commentTextEnd < 0 ? text.length : commentTextEnd + 2;
        const commentText = text.slice(
            commentTextStart,
            commentTextEnd < 0 ? text.length : commentTextEnd,
        );

        if (isTriggerCommentText(commentText)) {
            comments.push(
                addRangeToComment(
                    {
                        loc: {
                            end: getLocation(commentEnd),
                            start: getLocation(commentStart),
                        },
                        type: 'Block',
                        value: commentText,
                    },
                    commentStart,
                    commentEnd,
                ),
            );
        }

        return commentEnd;
    }

    function scanTemplateLiteral(characterIndex: number): number {
        characterIndex++;

        while (characterIndex < text.length) {
            const currentCharacter = text[characterIndex];
            const nextCharacter = text[characterIndex + 1];

            if (currentCharacter === '\\') {
                characterIndex += 2;
            } else if (currentCharacter === '`') {
                return characterIndex + 1;
            } else if (currentCharacter === '$' && nextCharacter === '{') {
                characterIndex = scanJavaScript(characterIndex + 2, true);
            } else {
                characterIndex++;
            }
        }

        return characterIndex;
    }

    function scanJavaScript(characterIndex: number, stopAtTemplateExpressionEnd: boolean): number {
        let braceDepth = 0;

        while (characterIndex < text.length) {
            const currentCharacter = text[characterIndex];
            const nextCharacter = text[characterIndex + 1];

            if (currentCharacter === '"' || currentCharacter === "'") {
                characterIndex = skipQuotedString(characterIndex, currentCharacter);
            } else if (currentCharacter === '`') {
                characterIndex = scanTemplateLiteral(characterIndex);
            } else if (currentCharacter === '/' && nextCharacter === '/') {
                characterIndex = scanLineComment(characterIndex);
            } else if (currentCharacter === '/' && nextCharacter === '*') {
                characterIndex = scanBlockComment(characterIndex);
            } else if (stopAtTemplateExpressionEnd && currentCharacter === '{') {
                braceDepth++;
                characterIndex++;
            } else if (stopAtTemplateExpressionEnd && currentCharacter === '}') {
                if (braceDepth) {
                    braceDepth--;
                    characterIndex++;
                } else {
                    return characterIndex + 1;
                }
            } else {
                characterIndex++;
            }
        }

        return characterIndex;
    }

    scanJavaScript(0, false);

    return {
        comments,
        text,
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
            /**
             * Run external preprocessors before scanning trigger comments. Plugins like
             * `@ianvs/prettier-plugin-sort-imports` can rewrite imports and shift line numbers, so
             * trigger metadata must be based on the exact text that oxc will parse.
             */
            const nextText = externalParser.preprocess?.(text, removePlugin(options)) ?? text;
            const sanitizedInput = sanitizeOxcTriggerComments(nextText);
            const commentTriggers = parseCommentTriggers(sanitizedInput.comments, false);

            addMultilinePrinter(options);
            setCommentTriggersForOptions(options, commentTriggers);
            oxcPreprocessResults.set(options, {
                commentTriggers,
                text: sanitizedInput.text,
            });

            return sanitizedInput.text;
        },
    };
}
