import {getObjectTypedKeys} from '@augment-vir/common';
import {type Comment, type Node} from 'estree';
import {type ParserOptions} from 'prettier';
import {
    nextLinePatternComment,
    nextWrapThresholdComment,
    resetComment,
    setLinePatternComment,
    setWrapThresholdComment,
    untilNextLinePatternCommentRegExp,
    untilNextWrapThresholdCommentRegExp,
    untilSetLinePatternCommentRegExp,
    untilSetWrapThresholdCommentRegExp,
} from '../options.js';
import {extractComments} from './comments.js';

type LineNumberDetails<T> = {[lineNumber: number]: T};
export type LineCounts = LineNumberDetails<number[]>;
export type WrapThresholds = LineNumberDetails<number>;
export type CommentTriggerWithEnding<T> = {
    [P in keyof T]: {data: T[P]; lineEnd: number};
};

export type CommentTriggers = {
    nextLineCounts: LineCounts;
    setLineCounts: CommentTriggerWithEnding<LineCounts>;
    nextWrapThresholds: WrapThresholds;
    setWrapThresholds: CommentTriggerWithEnding<WrapThresholds>;
};

type InternalCommentTriggers = CommentTriggers & {
    resets: number[];
};

type TriggerLookupOptions = Partial<Pick<ParserOptions, 'originalText'>>;

const mappedCommentTriggers = new WeakMap<Node, CommentTriggers>();
const mappedCommentTriggersByOptions = new WeakMap<object, CommentTriggers>();
const mappedCommentTriggersByText = new Map<string, CommentTriggers>();
const triggerCommentTexts = [
    nextLinePatternComment,
    nextWrapThresholdComment,
    resetComment,
    setLinePatternComment,
    setWrapThresholdComment,
];

export function getCommentTriggers(
    key: Node,
    debug: boolean,
    options?: TriggerLookupOptions,
): CommentTriggers {
    const alreadyExisting = findCachedCommentTriggers(key, options);
    if (!alreadyExisting) {
        return setCommentTriggers(key, debug, options);
    }
    return alreadyExisting;
}

function findCachedCommentTriggers(
    key: Node,
    options: TriggerLookupOptions | undefined,
): CommentTriggers | undefined {
    /**
     * Prefer exact AST identity, then progressively fall back to caches that survive parser/plugin
     * pipelines which preserve text/options but replace the root object.
     */
    return (
        mappedCommentTriggers.get(key) ??
        getCachedProgramTriggers(key) ??
        getCachedOptionsTriggers(options) ??
        getCachedTextTriggers(options)
    );
}

function getCachedProgramTriggers(key: Node): CommentTriggers | undefined {
    const program = (key as {program?: unknown}).program;
    if (program && typeof program === 'object') {
        return mappedCommentTriggers.get(program as Node);
    } else {
        return undefined;
    }
}

function getCachedOptionsTriggers(
    options: TriggerLookupOptions | undefined,
): CommentTriggers | undefined {
    return options ? mappedCommentTriggersByOptions.get(options) : undefined;
}

function getCachedTextTriggers(
    options: TriggerLookupOptions | undefined,
): CommentTriggers | undefined {
    return options?.originalText
        ? mappedCommentTriggersByText.get(options.originalText)
        : undefined;
}

/**
 * Used by parser wrappers that collect trigger comments before AST comment attachment. The oxc
 * wrapper needs this because trigger comments may be sanitized before `@prettier/plugin-oxc` parses
 * the file.
 */
export function setCommentTriggersForNode(key: Node, commentTriggers: CommentTriggers): void {
    mappedCommentTriggers.set(key, commentTriggers);
}

/**
 * Parser wrappers can use this to persist trigger metadata when another plugin later swaps the AST
 * root object. The text cache is intentionally a fallback: exact AST and options identity remain
 * preferred when they survive the formatting pipeline.
 */
export function setCommentTriggersForOptions(
    options: object,
    commentTriggers: CommentTriggers,
    textEntries: string[],
): void {
    mappedCommentTriggersByOptions.set(options, commentTriggers);

    textEntries.forEach((textEntry) => {
        mappedCommentTriggersByText.set(textEntry, commentTriggers);
    });
}

function setCommentTriggers(
    rootNode: Node,
    debug: boolean,
    options: TriggerLookupOptions | undefined,
): CommentTriggers {
    // parse comments only on the root node so it only happens once
    const comments: Comment[] = extractComments(rootNode);
    if (debug) {
        console.info({
            comments,
        });
    }

    const commentTriggers = parseCommentTriggers(comments, debug);

    // save to a map so we don't have to recalculate these every time
    mappedCommentTriggers.set(rootNode, commentTriggers);
    if (options && typeof options === 'object') {
        setCommentTriggersForOptions(
            options,
            commentTriggers,
            options.originalText
                ? [
                      options.originalText,
                  ]
                : [],
        );
    }
    return commentTriggers;
}

export function parseCommentTriggers(comments: Comment[], debug: boolean): CommentTriggers {
    const starterTriggers: InternalCommentTriggers = {
        nextLineCounts: {},
        setLineCounts: {},
        nextWrapThresholds: {},
        setWrapThresholds: {},
        resets: [],
    };

    const internalCommentTriggers: InternalCommentTriggers = comments.reduce(
        (accum: InternalCommentTriggers, currentComment) => {
            const commentText = (currentComment.value as string | undefined)?.replace(/\n/g, ' ');

            if (!currentComment.loc) {
                throw new Error(`Cannot read line location for comment ${currentComment.value}`);
            }

            const nextLineCounts = getLineCounts(commentText, true, debug);
            if (nextLineCounts.length) {
                accum.nextLineCounts[currentComment.loc.end.line] = nextLineCounts;
            }

            const nextWrapThreshold = getWrapThreshold(commentText, true);
            if (nextWrapThreshold != undefined) {
                accum.nextWrapThresholds[currentComment.loc.end.line] = nextWrapThreshold;
            }

            const setLineCounts = getLineCounts(commentText, false, debug);
            if (setLineCounts.length) {
                accum.setLineCounts[currentComment.loc.end.line] = {
                    data: setLineCounts,
                    lineEnd: Infinity,
                };
            }

            const setWrapThreshold = getWrapThreshold(commentText, false);
            if (setWrapThreshold != undefined) {
                accum.setWrapThresholds[currentComment.loc.end.line] = {
                    data: setWrapThreshold,
                    lineEnd: Infinity,
                };
            }

            const resetComment = isResetComment(commentText);
            if (resetComment) {
                accum.resets.push(currentComment.loc.end.line);
            }

            return accum;
        },
        starterTriggers,
    );

    internalCommentTriggers.resets.sort((a, b) => a - b);

    setResets(internalCommentTriggers);

    const commentTriggers = {
        ...internalCommentTriggers,
    };
    delete (commentTriggers as Partial<InternalCommentTriggers>).resets;

    return commentTriggers;
}

function setResets(internalCommentTriggers: InternalCommentTriggers): void {
    if (!internalCommentTriggers.resets.length) {
        return;
    }

    applyResetWindows(internalCommentTriggers.setLineCounts, internalCommentTriggers.resets);
    applyResetWindows(internalCommentTriggers.setWrapThresholds, internalCommentTriggers.resets);
}

/** Persistent `set-*` comments stop applying at the next reset comment after their own line. */
function applyResetWindows<T extends LineNumberDetails<unknown>>(
    setTriggers: CommentTriggerWithEnding<T>,
    resets: number[],
): void {
    getObjectTypedKeys(setTriggers).forEach((lineNumber) => {
        const currentLineNumberStats = setTriggers[lineNumber];
        const numericLineNumber = Number(lineNumber);
        const endLineNumber: number =
            resets.find((resetLineNumber): boolean => {
                return numericLineNumber < resetLineNumber;
            }) ?? currentLineNumberStats.lineEnd;

        currentLineNumberStats.lineEnd = endLineNumber;
    });
}

export function isTriggerCommentText(commentText: string): boolean {
    const lowerCaseCommentText = commentText.toLowerCase();

    return triggerCommentTexts.some((triggerCommentText) => {
        return lowerCaseCommentText.includes(triggerCommentText);
    });
}

function getWrapThreshold(commentText: string | undefined, nextOnly: boolean): number | undefined {
    const searchText = nextOnly ? nextWrapThresholdComment : setWrapThresholdComment;
    const searchRegExp = nextOnly
        ? untilNextWrapThresholdCommentRegExp
        : untilSetWrapThresholdCommentRegExp;

    if (commentText?.toLowerCase().includes(searchText)) {
        const thresholdValue = Number(commentText.toLowerCase().replace(searchRegExp, '').trim());
        if (isNaN(thresholdValue)) {
            return undefined;
        } else {
            return thresholdValue;
        }
    } else {
        return undefined;
    }
}

export function parseNextLineCounts(input: string, nextOnly: boolean, debug: boolean): number[] {
    if (!input) {
        return [];
    }

    const searchRegExp = nextOnly
        ? untilNextLinePatternCommentRegExp
        : untilSetLinePatternCommentRegExp;

    const split = input
        .toLowerCase()
        .replace(searchRegExp, '')
        .replace(/,/g, '')
        .split(' ')
        .filter((entry) => !!entry);

    const firstSplit = split[0];
    if (firstSplit === '[') {
        split.splice(0, 1);
    } else if (firstSplit?.startsWith('[')) {
        split[0] = firstSplit.replace(/^\[/, '');
    }

    const lastSplitIndex = split.length - 1;
    const lastSplit = split[lastSplitIndex];
    if (lastSplit === ']') {
        split.splice(split.length - 1, 1);
    } else if (lastSplit?.endsWith(']')) {
        split[lastSplitIndex] = lastSplit.replace(/\]$/, '');
    }

    const numbers = split.map((entry) =>
        entry && !!entry.trim().match(/^\d+$/) ? Number(entry.trim()) : NaN,
    );

    const invalidNumbers = numbers
        .map((entry, index) => ({
            index,
            entry,
            original: split[index],
        }))
        .filter((entry) => {
            return isNaN(entry.entry);
        });

    if (invalidNumbers.length) {
        if (debug) {
            console.error(
                invalidNumbers.map((entry) => ({
                    index: entry.index,
                    original: entry.original,
                    parsed: entry,
                    split,
                    input,
                    numbers,
                    trim: entry.original?.trim(),
                    match: entry.original?.trim().match(/^\d+$/),
                    matched: !!entry.original?.trim().match(/^\d+$/),
                })),
            );
        }
        console.error(
            `Invalid number(s) for elements per line option/comment: ${invalidNumbers
                .map((entry) => entry.original)
                .join()}`,
        );
        return [];
    }
    return numbers;
}

function isResetComment(commentText: string | undefined): boolean {
    return !!commentText?.toLowerCase().includes(resetComment);
}

function getLineCounts(
    commentText: string | undefined,
    nextOnly: boolean,
    debug: boolean,
): number[] {
    const searchText = nextOnly ? nextLinePatternComment : setLinePatternComment;

    if (commentText?.toLowerCase().includes(searchText)) {
        return parseNextLineCounts(commentText, nextOnly, debug);
    } else {
        return [];
    }
}
