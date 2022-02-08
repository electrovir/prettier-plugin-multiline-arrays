import {Node} from 'estree';
import {AstPath, Doc, doc} from 'prettier';
import {isDocCommand, stringifyDoc} from '../augments/doc';
import {walkDoc} from './child-docs';
import {getMappedLineCounts} from './line-counts';

const nestingSyntaxOpen = '[{(<' as const;
const nestingSyntaxClose = ']})>' as const;

const found = 'Found "[" but';

function insertArrayLines(inputDoc: Doc, lineCounts: number[], debug: boolean): Doc {
    walkDoc(inputDoc, debug, (currentDoc, parentDocs, childIndex): boolean => {
        const currentParent = parentDocs[0];
        const parentDoc = currentParent?.parent;
        if (typeof currentDoc === 'string' && currentDoc.trim() === '[') {
            if (debug) {
                console.info({currentDoc, parentDoc});
            }
            if (!Array.isArray(parentDoc) || parentDoc.length !== 4) {
                throw new Error(`${found} parentDoc is not an array.`);
            }
            if (childIndex !== 0) {
                throw new Error(`${found} not at index 0 in its parent`);
            }
            const bracketSibling = parentDoc[childIndex + 1];
            if (debug) {
                console.info({bracketSibling});
            }
            if (bracketSibling === ']') {
                return false;
            }
            if (!isDocCommand(bracketSibling) || bracketSibling.type !== 'indent') {
                throw new Error(`${found} its sibling was not an indent Doc.: ${bracketSibling}`);
            }
            const indentContents = bracketSibling.contents;
            if (debug) {
                console.info({indentContents});
            }
            if (!Array.isArray(indentContents)) {
                throw new Error(`${found} indent didn't have array contents.`);
            }
            if (indentContents.length !== 3) {
                console.error();
                throw new Error(
                    `${found} indent contents did not have 3 children:\n\t${stringifyDoc(
                        indentContents,
                    )
                        .flat()
                        .join(',\n\t')}`,
                );
            }

            const startingLine = indentContents[0];
            if (debug) {
                console.info({firstIndentContentsChild: startingLine});
            }
            if (!isDocCommand(startingLine) || startingLine.type !== 'line') {
                throw new Error(`${found} first indent child was not a line.`);
            }
            indentContents[0] = '';

            const indentedContent = indentContents[1];

            if (debug) {
                console.info({
                    secondIndentContentsChild: indentedContent,
                    itsFirstChild: (indentedContent as any)[0],
                });
            }
            if (!indentedContent) {
                console.error('second indent child (indentedContent) is not defined:', {
                    indentContents,
                    indentedContent,
                });
                throw new Error(`${found} second indent child is not a fill.`);
            }

            if (
                !Array.isArray(indentedContent) &&
                !(isDocCommand(indentedContent) && indentedContent.type === 'fill')
            ) {
                console.error('second indent child (indentCode) is not a fill doc or an array:', {
                    indentContents,
                    indentCode: indentedContent,
                });
                throw new Error(`${found} second indent child is not a fill doc or an array.`);
            }

            if (
                Array.isArray(indentedContent)
                    ? indentedContent.length === 0
                    : indentedContent.parts.length === 0
            ) {
                throw new Error(`${found} indentedContent has no length.`);
            }

            // lineIndex is 0 indexed
            let lineIndex = 0;
            // columnCount is 1 indexed
            let columnCount = 1;

            if (debug) {
                console.info(`>>>>>>>>>>>>>> Walking children for commas`);
            }

            let finalLineBreakExists = false;

            walkDoc(
                indentedContent,
                debug,
                (currentDoc, commaParents, commaChildIndex): boolean => {
                    finalLineBreakExists = false;
                    const innerCurrentParent = commaParents[0];
                    const commaParentDoc = innerCurrentParent?.parent;
                    if (isDocCommand(currentDoc) && currentDoc.type === 'if-break') {
                        finalLineBreakExists = true;
                        if (!commaParentDoc) {
                            throw new Error(`Found if-break without a parent`);
                        }
                        if (!Array.isArray(commaParentDoc)) {
                            throw new Error(`if-break parent is not an array`);
                        }
                        if (commaChildIndex == undefined) {
                            throw new Error(`if-break child index is undefined`);
                        }
                        commaParentDoc[commaChildIndex] = currentDoc.breakContents;
                        commaParentDoc.splice(commaChildIndex + 1, 0, doc.builders.breakParent);
                    } else if (typeof currentDoc === 'string') {
                        if (!commaParentDoc) {
                            console.error({innerParentDoc: commaParentDoc});
                            throw new Error(`Found string but innerParentDoc is not defined.`);
                        }
                        if (currentDoc && nestingSyntaxOpen.includes(currentDoc)) {
                            if (!Array.isArray(commaParentDoc)) {
                                throw new Error(`Found opening syntax but parent is not an array.`);
                            }
                            const closingIndex = commaParentDoc.findIndex(
                                (sibling) =>
                                    typeof sibling === 'string' &&
                                    sibling &&
                                    nestingSyntaxClose.includes(sibling),
                            );
                            if (closingIndex < 0) {
                                throw new Error(`Could not find closing match for ${currentDoc}`);
                            }
                            if (commaParentDoc[closingIndex] !== ']') {
                                const closingSibling = commaParentDoc[closingIndex - 1];
                                if (debug) {
                                    console.info({closingIndex, closingSibling});
                                }
                                if (closingSibling) {
                                    if (
                                        typeof closingSibling === 'object' &&
                                        !Array.isArray(closingSibling) &&
                                        closingSibling.type === 'line'
                                    ) {
                                        finalLineBreakExists = true;
                                    }
                                }
                            }
                            return false;
                        } else if (currentDoc && nestingSyntaxClose.includes(currentDoc)) {
                            throw new Error(`Found closing syntax which shouldn't be walked`);
                        } else if (currentDoc === ',') {
                            if (debug) {
                                console.info({foundCommaIn: commaParentDoc});
                            }
                            if (!Array.isArray(commaParentDoc)) {
                                console.error({innerParentDoc: commaParentDoc});
                                throw new Error(`Found comma but innerParentDoc is not an array.`);
                            }
                            if (commaChildIndex == undefined) {
                                throw new Error(`Found comma but childIndex is undefined.`);
                            }

                            let siblingIndex: number = commaChildIndex + 1;
                            let parentToMutate: Doc[] = commaParentDoc;
                            if (commaChildIndex === commaParentDoc.length - 1) {
                                const commaGrandParent = commaParents[1];
                                if (commaGrandParent == undefined) {
                                    throw new Error(`Could not find grandparent of comma group.`);
                                }
                                if (commaGrandParent.childIndexInThisParent == undefined) {
                                    throw new Error(`Could not find index of comma group parent`);
                                }
                                if (!Array.isArray(commaGrandParent.parent)) {
                                    throw new Error(`Comma group grandparent is not an array.`);
                                }
                                siblingIndex = commaGrandParent.childIndexInThisParent + 1;
                                parentToMutate = commaGrandParent.parent;
                            }

                            if (debug) {
                                console.info({commaParentDoc, parentToMutate, siblingIndex});
                            }

                            const commaSibling = parentToMutate[siblingIndex];
                            if (!isDocCommand(commaSibling) || commaSibling.type !== 'line') {
                                throw new Error(
                                    `Found comma but its following sibling is not a line: ${commaSibling}`,
                                );
                            }

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
                                /**
                                 * Don't use doc.builders.hardline here. It causes "invalid size
                                 * error" which I don't understand and which has no other useful
                                 * information or stack trace.
                                 */
                                if (debug) {
                                    console.info({breakingAfter: parentToMutate[siblingIndex - 1]});
                                }
                                parentToMutate[siblingIndex] =
                                    doc.builders.hardlineWithoutBreakParent;
                            } else {
                                parentToMutate[siblingIndex] = ' ';
                                columnCount++;
                            }
                        }
                    }
                    return true;
                },
            );

            if (!finalLineBreakExists) {
                if (debug) {
                    console.info(
                        `Parsed all array children but finalBreakHappened = ${finalLineBreakExists}`,
                    );
                }

                const closingBracketIndex: number = parentDoc.findIndex(
                    (openingBracketSibling) => openingBracketSibling === ']',
                );
                parentDoc.splice(closingBracketIndex, 0, doc.builders.hardlineWithoutBreakParent);
            }

            if (Array.isArray(indentedContent)) {
                indentContents.splice(
                    1,
                    1,
                    doc.builders.group([
                        doc.builders.hardlineWithoutBreakParent,
                        ...indentedContent,
                    ]),
                );
            } else {
                indentedContent.parts = [
                    doc.builders.group([
                        doc.builders.hardlineWithoutBreakParent,
                        ...indentedContent.parts,
                    ]),
                ];
            }

            // don't walk any deeper
            return false;
        } else if (debug) {
            console.info({ignoring: currentDoc});
        }

        return true;
    });

    // return what is input because we perform mutations on it
    return inputDoc;
}

export function printWithMultilineArrays(
    originalFormattedOutput: Doc,
    path: AstPath,
    debug: boolean,
): Doc {
    const rootNode = path.stack[0];
    if (!rootNode) {
        throw new Error(
            `Could not find valid root node in ${path.stack.map((entry) => entry.type).join(',')}`,
        );
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
            const lineCountMap = getMappedLineCounts(rootNode, debug);
            const lineCounts = lineCountMap[lastLine] ?? [];

            if (debug) {
                console.info(`======= Starting call to ${insertArrayLines.name}: =======`);
                console.info({lineCounts});
            }
            const newDoc = insertArrayLines(originalFormattedOutput, lineCounts, debug);
            return newDoc;
        }
    }

    return originalFormattedOutput;
}
