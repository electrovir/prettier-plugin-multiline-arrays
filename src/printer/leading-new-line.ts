import {BaseNode} from 'estree';
import {extractTextBetweenRanges} from '../augments/array';

export function containsLeadingNewline(
    nodeLocation: BaseNode['loc'],
    children: (BaseNode | null)[],
    originalLines: string[],
    debug: boolean,
) {
    const firstElement = children[0];
    if (firstElement) {
        const startLocation = nodeLocation?.start;
        if (!startLocation) {
            return false;
        }
        const endLocation = firstElement.loc?.start;
        if (!endLocation) {
            return false;
        }
        let textBeforeFirstElement = extractTextBetweenRanges(originalLines, {
            start: {
                column: startLocation.column - 1,
                line: startLocation.line - 1,
            },
            end: {
                column: endLocation.column - 1,
                line: endLocation.line - 1,
            },
        });
        if (debug) {
            console.info(
                `containsLeadingNewline textBeforeFirstElement: ${textBeforeFirstElement}`,
            );
        }
        if (textBeforeFirstElement.includes('\n')) {
            return true;
        }
    }
    return false;
}
