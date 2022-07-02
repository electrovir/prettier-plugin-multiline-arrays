import {isTruthy} from 'augment-vir/dist';
import {Doc, doc} from 'prettier';
import {isDocCommand, stringifyDoc} from '../augments/doc';
import {walkDoc} from './child-docs';

function isArgGroup(doc: doc.builders.Doc): boolean {
    if (!isDocCommand(doc)) {
        return false;
    }
    if (doc.type !== 'group') {
        return false;
    }
    const contents = doc.contents;
    if (!Array.isArray(contents)) {
        return false;
    }
    const firstElement = contents[0];
    const wrapperArray = Array.isArray(firstElement) ? firstElement : contents;
    if (!Array.isArray(wrapperArray)) {
        return false;
    }
    if (wrapperArray.filter(isTruthy)[0] !== '(') {
        return false;
    }

    return true;
}

const found = 'Found "(" but';

export function insertLinesIntoArguments(
    inputDoc: Doc,
    forceWrap: boolean,
    lineCounts: number[],
    wrapThreshold: number,
    debug: boolean,
): Doc {
    walkDoc(inputDoc, debug, (currentDoc, parentDocs, childIndex): boolean => {
        const currentParent = parentDocs[0];
        const parentDoc = currentParent?.parent;
        if (typeof currentDoc === 'string' && currentDoc.trim() === '(') {
            const undoMutations: (() => void)[] = [];

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
            const openingSibling = parentDoc[openingSiblingIndex];
            if (isDocCommand(openingSibling)) {
                // case 1. sibling is indent
                if (isDocCommand(openingSibling) && openingSibling.type === 'indent') {
                }
                // case 2. sibling is concat
                else if (isDocCommand(openingSibling) && openingSibling.type === 'concat') {
                }
                // case 3. sibling is group
                else if (openingSibling.type === 'group') {
                } else {
                    throw new Error(``);
                }
            }
            // case 4. sibling is an array
            else if (Array.isArray(openingSibling)) {
            } else {
                throw new Error(`${found} its sibling was not of an expected type`);
            }

            // don't walk any deeper
            return false;
        } else if (debug) {
            console.info({ignoring: currentDoc});
        }

        return true;
    });
    return inputDoc;
}
