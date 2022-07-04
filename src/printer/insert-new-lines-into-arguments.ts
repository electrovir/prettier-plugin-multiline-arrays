import {Doc, doc} from 'prettier';
import {isDocCommand, stringifyDoc} from '../augments/doc';
import {walkDoc} from './child-docs';

const nestingSyntaxOpen = '[{(`' as const;
const nestingSyntaxClose = ']})`' as const;

const found = 'Found "(" but';

export function insertLinesIntoArguments(
    inputDoc: Doc,
    forceWrap: boolean,
    lineCounts: number[],
    wrapThreshold: number,
    includesTrailingComma: boolean,
    debug: boolean,
): Doc {
    walkDoc(inputDoc, debug, (currentDoc, parentDocs, childIndex): boolean => {
        const currentParent = parentDocs[0];
        const parentDoc = currentParent?.parent;
        if (typeof currentDoc === 'string' && currentDoc.trim() === '(') {
            const undoMutations: (() => void)[] = [];
            let arrayChildCount = 0;

            if (!Array.isArray(parentDoc)) {
                if (debug) {
                    console.error({brokenParent: parentDoc, currentDoc});
                }
                throw new Error(`${found} parentDoc is not an array.`);
            }

            if (debug) {
                console.info({currentDoc, parentDoc});
                console.info(JSON.stringify(stringifyDoc(parentDoc, true), null, 4));
            }

            if (childIndex == undefined) {
                throw new Error(`${found} childIndex is undefined`);
            }

            const openingSiblingIndex = childIndex + 1;
            // sibling to the '('
            const openingSibling = parentDoc[openingSiblingIndex];
            let findingSiblingChildren: doc.builders.Doc;
            let codePath = '';
            if (isDocCommand(openingSibling)) {
                // case 1. sibling is indent
                if (isDocCommand(openingSibling) && openingSibling.type === 'indent') {
                    findingSiblingChildren = openingSibling.contents;
                    codePath = 'indent';
                }
                // case 2. sibling is concat
                else if (isDocCommand(openingSibling) && openingSibling.type === 'concat') {
                    findingSiblingChildren = openingSibling.parts;
                    codePath = 'concat';
                }
                // case 3. sibling is group
                else if (openingSibling.type === 'group') {
                    const originalBreakValue = openingSibling.break;
                    openingSibling.break = true;
                    undoMutations.push(() => {
                        openingSibling.break = originalBreakValue;
                    });
                    findingSiblingChildren = openingSibling.contents;
                    codePath = 'group';
                } else {
                    throw new Error(
                        `${found} and sibling was doc command but didn't match expected types.`,
                    );
                }
            }
            // case 4. sibling is an array
            else if (Array.isArray(openingSibling)) {
                findingSiblingChildren = openingSibling;
                codePath = 'array';
            } else if (openingSibling === '' && parentDoc[openingSiblingIndex + 1] === ')') {
                // this is for just an empty call, like the parentheses here: () => {}
                return false;
            } else {
                throw new Error(`${found} its sibling was not of an expected type`);
            }

            if (!Array.isArray(findingSiblingChildren)) {
                throw new Error(`${found} its sibling's children were not in an array.`);
            }
            const foundSiblingChildren = findingSiblingChildren;

            foundSiblingChildren.forEach((child, index) => {
                if (isDocCommand(child) && child.type === 'line') {
                    foundSiblingChildren[index] = doc.builders.hardlineWithoutBreakParent;
                    undoMutations.push(() => {
                        foundSiblingChildren[index] = child;
                    });
                } else if (
                    child &&
                    typeof child === 'string' &&
                    child !== ',' &&
                    !nestingSyntaxClose.includes(child)
                ) {
                    arrayChildCount++;
                } else if (Array.isArray(child)) {
                    arrayChildCount++;
                }
            });

            foundSiblingChildren.splice(0, 0, doc.builders.breakParent);
            undoMutations.push(() => {
                foundSiblingChildren.splice(0, 1);
            });

            if (arrayChildCount <= wrapThreshold && !lineCounts.length && !forceWrap) {
                undoMutations.reverse().forEach((undoMutation) => {
                    undoMutation();
                });
            } else {
                // foundSiblingChildren.push(',', doc.builders.hardline);
                // parentDoc.forEach((docEntry, index) => {
                //     if (isDocCommand(docEntry)) {
                //         if (docEntry.type === 'line') {
                //             parentDoc[index] = doc.builders.hardlineWithoutBreakParent;
                //         } else if (docEntry.type === 'if-break') {
                //             parentDoc[index] = docEntry.breakContents;
                //         }
                //     }
                // });
                // parentDoc.splice(openingSiblingIndex, 0, doc.builders.hardlineWithoutBreakParent);
                // parentDoc.splice(
                //     0,
                //     0,
                //     doc.builders.breakParent,
                //     doc.builders.hardlineWithoutBreakParent,
                // );
                // const grandparentDoc = parentDocs[1]?.parent;
                // if (!grandparentDoc || typeof grandparentDoc === 'string') {
                //     throw new Error(
                //         `Invalid grandparentDoc value, these could not have had children.`,
                //     );
                // }
                // walkDoc(grandparentDoc, debug, (grandparentInnerDoc) => {
                //     if (Array.isArray(grandparentInnerDoc)) {
                //         grandparentInnerDoc.splice(0, 0, doc.builders.breakParent);
                //         return false;
                //     }
                //     return true;
                // });
            }

            debugger;
            // console.log({codePath, siblingChildren: findingSiblingChildren});

            // don't walk any deeper
            return false;
        } else if (debug) {
            console.info({ignoring: currentDoc});
        }

        return true;
    });
    return inputDoc;
}
