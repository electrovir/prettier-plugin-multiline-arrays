import {getObjectTypedKeys} from 'augment-vir';
import {Comment, Node} from 'estree';
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
} from '../options';
import {extractComments} from './comments';

type LineNumberDetails<T> = {[lineNumber: number]: T};
export type LineCounts = LineNumberDetails<number[]>;
export type WrapThresholds = LineNumberDetails<number>;
export type CommentTriggerWithEnding<T> = {[P in keyof T]: {data: T[P]; lineEnd: number}};

export type CommentTriggers = {
    nextLineCounts: LineCounts;
    setLineCounts: CommentTriggerWithEnding<LineCounts>;
    nextWrapThresholds: WrapThresholds;
    setWrapThresholds: CommentTriggerWithEnding<WrapThresholds>;
};

type InternalCommentTriggers = CommentTriggers & {
    resets: number[];
};

const mappedCommentTriggers = new WeakMap<Node, CommentTriggers>();

export function getCommentTriggers(key: Node, debug: boolean): CommentTriggers {
    const alreadyExisting = mappedCommentTriggers.get(key);
    if (!alreadyExisting) {
        return setCommentTriggers(key, debug);
    }
    return alreadyExisting;
}

function setCommentTriggers(rootNode: Node, debug: boolean): CommentTriggers {
    // parse comments only on the root node so it only happens once
    const comments: Comment[] = extractComments(rootNode);
    if (debug) {
        console.info({comments});
    }

    const starterTriggers: InternalCommentTriggers = {
        nextLineCounts: {},
        setLineCounts: {},
        nextWrapThresholds: {},
        setWrapThresholds: {},
        resets: [],
    };

    const internalCommentTriggers: InternalCommentTriggers = comments.reduce(
        (accum: InternalCommentTriggers, currentComment) => {
            const commentText = currentComment.value?.replace(/\n/g, ' ');

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

    internalCommentTriggers.resets = internalCommentTriggers.resets.sort();

    setResets(internalCommentTriggers);

    const commentTriggers = {...internalCommentTriggers};
    delete (commentTriggers as Partial<InternalCommentTriggers>).resets;

    // save to a map so we don't have to recalculate these every time
    mappedCommentTriggers.set(rootNode, commentTriggers);
    return commentTriggers;
}

function setResets(internalCommentTriggers: InternalCommentTriggers): void {
    if (!internalCommentTriggers.resets.length) {
        return;
    }

    const setLineCountLineNumbers = getObjectTypedKeys(internalCommentTriggers.setLineCounts);
    if (setLineCountLineNumbers.length) {
        setLineCountLineNumbers.forEach((lineNumber) => {
            const currentLineNumberStats = internalCommentTriggers.setLineCounts[lineNumber];
            if (!currentLineNumberStats) {
                throw new Error(
                    `Line number stats were undefined for "${lineNumber}" in "${JSON.stringify(
                        internalCommentTriggers.setLineCounts,
                    )}"`,
                );
            }
            const endLineNumber: number =
                internalCommentTriggers.resets.find((resetLineNumber): boolean => {
                    return lineNumber < resetLineNumber;
                }) ?? currentLineNumberStats.lineEnd;

            currentLineNumberStats.lineEnd = endLineNumber;
        });
    }
    const setWrapThresholdLineNumbers = getObjectTypedKeys(
        internalCommentTriggers.setWrapThresholds,
    );
    if (setWrapThresholdLineNumbers.length) {
    }
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
        .map((entry, index) => ({index, entry, original: split[index]}))
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
