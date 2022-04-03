import {extractTextBetweenRanges} from '../augments/array';
import {ArrayLikeNode} from './supported-node-types';

export function containsTrailingComma(
    arrayExpression: Pick<ArrayLikeNode, 'elements' | 'loc'>,
    originalLines: string[],
    debug: boolean,
): boolean {
    const lastElement = arrayExpression.elements[arrayExpression.elements.length - 1];
    if (lastElement) {
        const startLocation = lastElement.loc?.end;
        if (!startLocation) {
            return false;
        }
        const endLocation = arrayExpression.loc?.end;
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
