// prettier-multiline-arrays-next-line-pattern: 2 1
export const linePatternArray = [
    'a', 'b',
    'c',
    'd', 'e',
];

// Even if this example had a leading new line or a trailing comma, it won't wrap because the
// comment overrides that behavior.
// prettier-multiline-arrays-next-threshold: 10
export const highThresholdArray = ['a', 'b', 'c', 'd', 'e'];

// this array doesn't fully wrap even though it exceeded the column width because the
// "next-line-pattern" comment overrides Prettier's column width wrapping
// prettier-multiline-arrays-next-line-pattern: 100
export const superHighThresholdArray = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u',
];
