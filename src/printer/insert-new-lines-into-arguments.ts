import {Doc, doc} from 'prettier';
import {isDocCommand} from '../augments/doc';
import {walkDoc} from './child-docs';

export function insertLinesIntoArguments(
    inputDoc: Doc,
    forceWrap: boolean,
    lineCounts: number[],
    wrapThreshold: number,
    debug: boolean,
): Doc {
    walkDoc(inputDoc, debug, (currentDoc): boolean => {
        debugger;

        let arrayChildCount = 0;
        const undoMutations: (() => void)[] = [];
        if (!Array.isArray(currentDoc)) {
            throw new Error(`expected currentDoc to be an array`);
        }
        const inputArgsGroup = currentDoc
            .slice()
            .reverse()
            .find((innerDoc) => isDocCommand(innerDoc) && innerDoc.type === 'group');
        if (!inputArgsGroup) {
            // "require()" imports trigger this code path and should not be formatted
            return false;
        }
        if (!isDocCommand(inputArgsGroup) || inputArgsGroup.type !== 'group') {
            throw new Error(`Expected inputArgsGroup to be a group doc command.`);
        }

        const inputArgsGroupContents = inputArgsGroup.contents;

        if (!Array.isArray(inputArgsGroupContents)) {
            throw new Error(`inputArgsGroupContents is not an array`);
        }

        let indentParent = inputArgsGroupContents;
        let inputArgsIndentIndex = indentParent.findIndex(
            (groupContent) => isDocCommand(groupContent) && groupContent.type === 'indent',
        );
        if (inputArgsIndentIndex === -1) {
            const innerContents = inputArgsGroupContents[0];
            if (!Array.isArray(innerContents)) {
                throw new Error(`Expected innerContents to be an array`);
            }
            indentParent = innerContents;
            inputArgsIndentIndex = indentParent.findIndex(
                (groupContent) => isDocCommand(groupContent) && groupContent.type === 'indent',
            );
        }
        const inputArgsIndent = indentParent[inputArgsIndentIndex];
        if (!isDocCommand(inputArgsIndent) || inputArgsIndent.type !== 'indent') {
            throw new Error(`inputArgsIndent should be an indent doc`);
        }

        const ifBreakIndex = inputArgsIndentIndex + 1;
        const inputArgsFinalIfBreak = indentParent[ifBreakIndex];
        if (!isDocCommand(inputArgsFinalIfBreak) || inputArgsFinalIfBreak.type !== 'if-break') {
            throw new Error(`inputArgsFinalIfBreak should be an if-break doc`);
        }
        indentParent[ifBreakIndex] = inputArgsFinalIfBreak.breakContents;
        undoMutations.push(() => {
            indentParent[ifBreakIndex] = inputArgsFinalIfBreak;
        });

        const lineBreakIndex = inputArgsIndentIndex + 2;
        const finalLineBreak = indentParent[lineBreakIndex];
        if (!isDocCommand(finalLineBreak) || finalLineBreak.type !== 'line') {
            throw new Error(`Expected finalLineBreak to be a line doc.`);
        }
        indentParent[lineBreakIndex] = doc.builders.hardlineWithoutBreakParent;
        undoMutations.push(() => {
            indentParent[lineBreakIndex] = finalLineBreak;
        });

        const indentContents = inputArgsIndent.contents;

        if (!Array.isArray(indentContents)) {
            throw new Error(`indentContents should be an array`);
        }

        indentContents.forEach((indentContent, index) => {
            debugger;
            if (Array.isArray(indentContent)) {
                const lastChildIndex = indentContent.length - 1;
                const lastChild = indentContent[lastChildIndex];

                if (index === indentContents.length - 1) {
                    // don't operate on the last item
                    return;
                }

                arrayChildCount++;

                if (isDocCommand(lastChild) && lastChild.type === 'line') {
                    indentContent[lastChildIndex] = doc.builders.hardlineWithoutBreakParent;
                    undoMutations.push(() => {
                        indentContent[lastChildIndex] = lastChild;
                    });
                }
            } else if (isDocCommand(indentContent) && indentContent.type === 'line') {
                const oldParts = indentContent;
                indentContents[index] = doc.builders.hardlineWithoutBreakParent;
                undoMutations.push(() => {
                    indentContents[index] = oldParts;
                });
            }
        });

        if (arrayChildCount < wrapThreshold && !lineCounts.length && !forceWrap) {
            undoMutations.reverse().forEach((undoMutation) => {
                undoMutation();
            });
        }

        return false;
    });
    return inputDoc;
}
