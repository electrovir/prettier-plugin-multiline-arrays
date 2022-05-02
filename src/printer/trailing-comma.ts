import {BaseNode} from 'estree';
import {extractTextBetweenRanges} from '../augments/array';

export function containsTrailingComma(
    nodeLocation: BaseNode['loc'],
    children: (BaseNode | null)[],
    originalLines: string[],
    debug: boolean,
): boolean {
    const lastElement = children[children.length - 1];
    if (lastElement) {
        const startLocation = lastElement.loc?.end;
        if (!startLocation) {
            return false;
        }
        const endLocation = nodeLocation?.end;
        if (!endLocation) {
            return false;
        }
        let textPastLastElement = extractTextBetweenRanges(originalLines, {
            start: {
                column: startLocation.column - 1,
                line: startLocation.line - 1,
            },
            end: {
                column: endLocation.column - 1,
                line: endLocation.line - 1,
            },
        });

        if (textPastLastElement.includes(',')) {
            return true;
        }
    }
    return false;
}
