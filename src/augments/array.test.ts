import {extractTextBetweenRanges} from './array';

describe(extractTextBetweenRanges.name, () => {
    it('should extract text from multiple lines', () => {
        expect(
            extractTextBetweenRanges(
                [
                    'a b c d e f g h i j k l m n',
                    'o p q r s',
                    't u v w x y',
                    'z',
                ],
                {start: {line: 0, column: 4}, end: {line: 2, column: 3}},
            ),
        ).toBe('c d e f g h i j k l m n\no p q r s\nt ');
    });

    it('should extract text from the same line', () => {
        expect(
            extractTextBetweenRanges(
                [
                    'a b c d e f g h i j k l m n',
                ],
                {start: {line: 0, column: 4}, end: {line: 0, column: 7}},
            ),
        ).toBe(' c ');
    });
});
