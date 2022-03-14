import type {SourceLocation} from 'estree';

/** Line is 0 indexed while column is 1 indexed. */
export function extractTextBetweenRanges(
    input: string[],
    range: Omit<SourceLocation, 'source'>,
): string {
    if (range.start.line > range.end.line) {
        throw new Error(
            `Start line "${range.start.line}" cannot be greater than end line "${range.end.line}"`,
        );
    }
    if (range.start.line === range.end.line) {
        if (range.start.column >= range.end.column) {
            throw new Error(
                `When start and end are on the same line, the start column "${range.start.column}" must be less than the end column "${range.end.column}".`,
            );
        }
        return input[range.start.line]?.slice(range.start.column - 1, range.end.column - 1) ?? '';
    }

    let extractedText: string = input[range.start.line]?.slice(range.start.column) ?? '';

    extractedText += '\n';

    for (let lineIndex = range.start.line + 1; lineIndex < range.end.line; lineIndex++) {
        extractedText += input[lineIndex];
        extractedText += '\n';
    }

    extractedText += input[range.end.line]?.slice(0, range.end.column - 1) ?? '';

    return extractedText;
}
