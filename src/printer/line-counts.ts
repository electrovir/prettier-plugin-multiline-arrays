import {Comment, Node} from 'estree';
import {elementsPerLineTrigger, untilLineTriggerRegExp} from '../metadata/package-phrases';
import {extractComments} from './comments';

const mappedLineCounts = new WeakMap<Node, Record<number, number[]>>();

export function getMappedLineCounts(key: Node, debug: boolean): Record<number, number[]> {
    const alreadyExisting = mappedLineCounts.get(key);
    if (!alreadyExisting) {
        return setLineCounts(key, debug);
    }
    return alreadyExisting;
}

function setLineCounts(rootNode: Node, debug: boolean): Record<number, number[]> {
    // parse comments only on the root node so it only happens once
    const comments: Comment[] = extractComments(rootNode);
    if (debug) {
        console.info({comments});
    }
    const keyedCommentsByLastLine: Record<number, number[]> = comments.reduce(
        (accum, currentComment) => {
            const commentText = currentComment.value?.replace(/\n/g, ' ');
            if (commentText?.toLowerCase().includes(elementsPerLineTrigger)) {
                const split = commentText
                    .toLowerCase()
                    .replace(untilLineTriggerRegExp, '')
                    .replace(/,/g, '')
                    .split(' ');
                const numbers = split
                    .map((entry) => (entry && entry.trim().match(/\d+/) ? Number(entry) : NaN))
                    .filter((entry) => !isNaN(entry));
                if (!currentComment.loc) {
                    throw new Error(
                        `Cannot read line location for comment ${currentComment.value}`,
                    );
                }
                accum[currentComment.loc.end.line] = numbers;
            }
            return accum;
        },
        {} as Record<number, number[]>,
    );

    // save to a map so we don't have to recalculate these every time
    mappedLineCounts.set(rootNode, keyedCommentsByLastLine);
    return keyedCommentsByLastLine;
}
