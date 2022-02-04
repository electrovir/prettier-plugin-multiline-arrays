import {Program} from 'esprima';
import {Comment, Node} from 'estree';
import {AstPath, Doc, doc} from 'prettier';
import {lineContainsTriggerComment, untilLineTriggerRegExp} from '../metadata/package-phrases';
import {hasChildDocs, walkDoc} from './child-docs';

const nestingSyntaxOpen = '[{(<' as const;
const nestingSyntaxClose = ']})>' as const;

function insertArrayLines(inputDoc: Doc, lineCounts: number[], debug: boolean): Doc {
    let extractedDoc: Doc = inputDoc;
    // pull contents out of an array with just a single group in it
    if (Array.isArray(inputDoc) && inputDoc.filter((entry) => !!entry).length === 1) {
        extractedDoc = inputDoc[0] ?? [];
        if (typeof extractedDoc !== 'string') {
            if ('contents' in extractedDoc) {
                extractedDoc = extractedDoc.contents;
            } else if ('parts' in extractedDoc) {
                extractedDoc = extractedDoc.parts;
            }
        }
    }

    if (typeof extractedDoc === 'string') {
        return extractedDoc;
    }

    // lineIndex is 0 indexed
    let lineIndex = 0;
    // columnCount is 1 indexed
    let columnCount = 1;
    // start at -1 because the first '[' will then stick us on level 0
    let nestedDepth = -1;

    walkDoc(extractedDoc, (currentDoc, parentDoc, childIndex): boolean => {
        if (parentDoc && Array.isArray(parentDoc) && childIndex != undefined) {
            if (!currentDoc) {
                return true;
            } else if (typeof currentDoc === 'string') {
                /**
                 * Track array depth so we can ignore nested arrays, otherwise they'd get formatted
                 * twice (cause nested arrays will already get formatted as an independent array).
                 */
                if (nestingSyntaxOpen.includes(currentDoc)) {
                    if (debug) {
                        console.log({currentDoc, status: 'increase nestedDepth'});
                    }
                    nestedDepth++;
                } else if (nestingSyntaxClose.includes(currentDoc)) {
                    if (debug) {
                        console.log({currentDoc, status: 'decrease nestedDepth'});
                    }
                    nestedDepth--;
                } else {
                    if (debug) {
                        console.log({currentDoc, status: 'doing nothing'});
                    }
                }
                return true;
            } else if (hasChildDocs(currentDoc)) {
                if (nestedDepth < 1) {
                    parentDoc[childIndex] = doc.builders.group(currentDoc);
                }
                return false;
            } else if (nestedDepth < 1) {
                if (currentDoc.type === 'line' && currentDoc.soft) {
                    parentDoc[childIndex] = doc.builders.hardlineWithoutBreakParent;
                } else if (currentDoc.type === 'line') {
                    let shouldLineBreak = false;
                    const currentLineCountIndex = lineIndex % lineCounts.length;
                    const currentLineCount: number | undefined = lineCounts.length
                        ? lineCounts[currentLineCountIndex]
                        : undefined;
                    if (
                        (currentLineCount && columnCount === currentLineCount) ||
                        !currentLineCount
                    ) {
                        // if we're on the last element of the line then increment to the next line
                        lineIndex++;
                        columnCount = 1;
                        shouldLineBreak = true;
                    } else {
                        columnCount++;
                    }

                    if (shouldLineBreak) {
                        if (debug) {
                            console.log({currentDoc, status: 'setting hard line'});
                        }
                        parentDoc[childIndex] = doc.builders.hardline;
                    }
                } else if (currentDoc.type === 'if-break') {
                    if (debug) {
                        console.log({currentDoc, status: 'setting break-if contents'});
                    }
                    // all breaks should act like they're getting broken
                    parentDoc[childIndex] = currentDoc.breakContents;
                }
            }
            return true;
        }
        return false;
    });

    return extractedDoc;
}

function hasComments(input: any): input is {comments: Comment[]} {
    return !!input.comments;
}

function extractComments(programNode: Program): Comment[] {
    const comments: Comment[] = programNode.comments ?? [];
    // this might duplicate comments but our later code doesn't care
    return comments.concat(
        programNode.body
            .reduce((accum, entry) => {
                if (hasComments(entry)) {
                    accum.push(...entry.comments);
                }
                return accum;
            }, [] as Comment[])
            .flat(),
    );
}

const mappedComments = new WeakMap<Node, Record<number, number[]>>();

function isProgramNode(input: any): input is Program {
    return input.type === 'Program';
}

function setLineCounts(programNode: Program): Record<number, number[]> {
    // parse comments only on the program node so it only happens once
    const comments: Comment[] = extractComments(programNode);
    const keyedCommentsByLastLine: Record<number, number[]> = comments.reduce(
        (accum, currentComment) => {
            const commentText = currentComment.value?.replace(/\n/g, ' ');
            if (commentText?.includes(lineContainsTriggerComment)) {
                const split = commentText.replace(untilLineTriggerRegExp, '').split(' ');
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
    mappedComments.set(programNode, keyedCommentsByLastLine);
    return keyedCommentsByLastLine;
}

export function printWithNewLineArrays(
    originalFormattedOutput: Doc,
    path: AstPath,
    debug: boolean,
): Doc {
    const programNode = path.stack[0];
    if (!isProgramNode(programNode)) {
        throw new Error(`Could not find valid program node in ${path.stack.join(',')}`);
    }
    const node = path.getValue() as Node | undefined;
    if (node) {
        if (
            node.type === 'ArrayExpression' ||
            node.type === 'ArrayPattern' ||
            (node.type as any) === 'TupleExpression'
        ) {
            if (!node.loc) {
                throw new Error(
                    `Could not find location of node ${'value' in node ? node.value : node.type}`,
                );
            }

            const lastLine = node.loc.start.line - 1;
            const lineCountMap = mappedComments.get(programNode) ?? setLineCounts(programNode);
            const lineCounts = lineCountMap[lastLine] ?? [];

            const newDoc = insertArrayLines(originalFormattedOutput, lineCounts, debug);
            return newDoc;
        }
    }

    return originalFormattedOutput;
}
