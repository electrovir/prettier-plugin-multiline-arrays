import {Comment, Node} from 'estree';
import {Doc, doc, Printer} from 'prettier';
import {lineContainsTriggerComment, untilLineTriggerRegExp} from '../metadata/package-phrases';
import {getAndSetJsPlugin, jsPlugin} from './jsplugin';
import {extractChildDocs, hasChildDocs, walkDoc} from './walk';

function insertArrayLines(inputDoc: Doc, lineCounts: number[]): Doc {
    let outerDoc: Doc = inputDoc;
    // pull to contents out of an array with just a single group in it
    if (Array.isArray(inputDoc) && inputDoc.filter((entry) => !!entry).length === 1) {
        outerDoc = inputDoc[0] ?? [];
        if (typeof outerDoc !== 'string') {
            if ('contents' in outerDoc) {
                outerDoc = outerDoc.contents;
            } else if ('parts' in outerDoc) {
                outerDoc = outerDoc.parts;
            }
        }
    }

    if (typeof outerDoc === 'string') {
        return outerDoc;
    }

    let lineIndex = 0;
    /**
     * Start on zeroth column as we want to ignore the first line, which then increments this to 1.
     * (column count is 1 indexed)
     */
    let columnCount = 0;
    // start at -1 because the first '[' will then stick us on level 0
    let nestedDepth = -1;

    walkDoc(outerDoc, (currentDoc) => {
        const childDocs = extractChildDocs(currentDoc);
        if (childDocs) {
            childDocs.forEach((childDoc, childIndex) => {
                // console.log({childDoc, nestedDepth});
                if (typeof childDoc === 'string') {
                    if (childDoc === '[') {
                        nestedDepth++;
                    } else if (childDoc === ']') {
                        nestedDepth--;
                    }
                } else if (hasChildDocs(childDoc)) {
                    return;
                } else if (childDoc.type === 'line' && childDoc.soft) {
                    childDocs[childIndex] = doc.builders.hardlineWithoutBreakParent;
                } else if (nestedDepth < 1) {
                    if (childDoc.type === 'line') {
                        let shouldLineBreak = false;
                        const currentLineCountIndex = lineIndex % lineCounts.length;
                        const currentLineCount: number | undefined = lineCounts.length
                            ? lineCounts[currentLineCountIndex]
                            : undefined;
                        // console.log({
                        //     currentLineCount,
                        //     currentLineCountIndex,
                        //     lineIndex,
                        //     columnCount,
                        // });
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
                            childDocs[childIndex] = doc.builders.hardlineWithoutBreakParent;
                        }
                    } else if (childDoc.type === 'if-break') {
                        childDoc.flatContents = childDoc.breakContents;
                    }
                }
            });
        }
    });

    return outerDoc;
}

const mappedComments = new WeakMap<Node, Record<number, number[]>>();

export const printWithNewLineArrays: Printer['print'] = (path, options, print) => {
    if (!jsPlugin) {
        getAndSetJsPlugin(options);
    }
    if (!jsPlugin) {
        throw new Error(`Did not set jsPlugin the first time!`);
    }

    const programNode = path.stack[0];
    if (!programNode) {
        throw new Error(`Could not find program node in ${path.stack.join(',')}`);
    }
    const node = path.getValue() as Node | undefined;
    if (node) {
        if (
            node.type === 'ArrayExpression' ||
            node.type === 'ArrayPattern' ||
            (node.type as any) === 'TupleExpression'
        ) {
            const printedArray = jsPlugin.printers.estree.print(path, options, print);

            if (!node.loc) {
                throw new Error(
                    `Could not find location of node ${'value' in node ? node.value : node.type}`,
                );
            }

            const lineCounts = mappedComments.get(programNode)?.[node.loc.start.line - 1] ?? [];

            // console.log({lineCounts});
            const newDoc = insertArrayLines(printedArray, lineCounts);
            return newDoc;
        } else if (node.type === 'Program') {
            const comments: Comment[] =
                node.comments ??
                node.body
                    .reduce((accum, entry) => {
                        if ((entry as any).comments) {
                            accum.push(...((entry as any).comments as Comment[]));
                        }
                        return accum;
                    }, [] as Comment[])
                    .flat();
            // console.log({comments});
            if (comments && comments.length) {
                const keyedCommentsByLastLine: Record<number, number[]> = comments.reduce(
                    (accum, currentComment) => {
                        const commentText = currentComment.value?.replace(/\n/g, ' ');
                        if (commentText?.includes(lineContainsTriggerComment)) {
                            const split = commentText
                                .replace(untilLineTriggerRegExp, '')
                                .split(' ');
                            const numbers = split
                                .map((entry) =>
                                    entry && entry.trim().match(/\d+/) ? Number(entry) : NaN,
                                )
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

                // console.log({keyedCommentsByLastLine});
                // save to a map so we don't have to recalculate these every time
                mappedComments.set(node, keyedCommentsByLastLine);
            }
        }
    }

    return jsPlugin.printers.estree.print(path, options, print);
};
