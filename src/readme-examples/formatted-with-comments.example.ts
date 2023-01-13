// prettier-multiline-arrays-next-line-pattern: 2 1
export const linePatternArray = [
    'a', 'b',
    'c',
    'd', 'e',
];

// prettier-multiline-arrays-next-threshold: 10
export const highThresholdArray = ['a', 'b', 'c', 'd', 'e'];

// this example wraps because a trailing comma was included, which forces wrapping despite
// the high threshold comment.
// prettier-multiline-arrays-next-threshold: 10
export const highThresholdWithTrailingComma = ['a', 'b', 'c', 'd', 'e'];
