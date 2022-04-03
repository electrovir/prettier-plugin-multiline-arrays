import {Comment, Node} from 'estree';
import {
    linePatternComment,
    untilLinePatternTriggerRegExp,
    untilWrapThresholdRegExp,
    wrapThresholdComment,
} from '../options';
import {extractComments} from './comments';

export type LineCounts = {[lineNumber: number]: number[]};
export type WrapThresholds = {[lineNumber: number]: number};

export type CommentTriggers = {
    lineCounts: LineCounts;
    wrapThresholds: WrapThresholds;
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
    const commentTriggers: CommentTriggers = comments.reduce(
        (accum: CommentTriggers, currentComment) => {
            const commentText = currentComment.value?.replace(/\n/g, ' ');

            if (!currentComment.loc) {
                throw new Error(`Cannot read line location for comment ${currentComment.value}`);
            }

            const lineCounts = getLineCounts(commentText, debug);
            if (lineCounts.length) {
                accum.lineCounts[currentComment.loc.end.line] = lineCounts;
            }
            const wrapThreshold = getWrapThreshold(commentText);
            if (wrapThreshold != undefined) {
                accum.wrapThresholds[currentComment.loc.end.line] = wrapThreshold;
            }

            return accum;
        },
        {
            lineCounts: {},
            wrapThresholds: {},
        },
    );

    // save to a map so we don't have to recalculate these every time
    mappedCommentTriggers.set(rootNode, commentTriggers);
    return commentTriggers;
}

function getWrapThreshold(commentText?: string): number | undefined {
    if (commentText?.toLowerCase().includes(wrapThresholdComment)) {
        const thresholdValue = Number(
            commentText.toLowerCase().replace(untilWrapThresholdRegExp, '').trim(),
        );
        if (isNaN(thresholdValue)) {
            return undefined;
        } else {
            return thresholdValue;
        }
    } else {
        return undefined;
    }
}

export function parseLineCounts(input: string, debug: boolean): number[] {
    if (!input) {
        return [];
    }
    const split = input
        .toLowerCase()
        .replace(untilLinePatternTriggerRegExp, '')
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

function getLineCounts(commentText: string | undefined, debug: boolean): number[] {
    if (commentText?.toLowerCase().includes(linePatternComment)) {
        return parseLineCounts(commentText, debug);
    } else {
        return [];
    }
}
