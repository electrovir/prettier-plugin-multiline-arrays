import {MultilineArrayTest, runTests} from './test-config';

const json5Tests: MultilineArrayTest[] = [
    {
        name: 'basic JSON format',
        // prettier-ignore
        code: `
            {
                hello: 'there',
                stuff: ['a', 'b', 'c', 'd', 'e'],
                object: {example: 'instance'}
            }
        `,
        expected: `
            {
                hello: 'there',
                stuff: [
                    'a',
                    'b',
                    'c',
                    'd',
                    'e',
                ],
                object: {example: 'instance'},
            }
        `,
    },
    {
        name: 'with object array element',
        // prettier-ignore
        code: `
            {
                hello: 'there',
                stuff: ['a', 'b', 'c', 'd', 'e', {example: 'instance'}],
                object: {example: 'instance'}
            }
        `,
        expected: `
            {
                hello: 'there',
                stuff: [
                    'a',
                    'b',
                    'c',
                    'd',
                    'e',
                    {example: 'instance'},
                ],
                object: {example: 'instance'},
            }
        `,
    },
    {
        name: 'with nested array',
        // prettier-ignore
        code: `
            {
                hello: 'there',
                stuff: ['a', 'b', 'c', 'd', 'e', ['f', 'g', 'h', 'i', 'j']],
                object: {example: 'instance'}
            }
        `,
        expected: `
            {
                hello: 'there',
                stuff: [
                    'a',
                    'b',
                    'c',
                    'd',
                    'e',
                    [
                        'f',
                        'g',
                        'h',
                        'i',
                        'j',
                    ],
                ],
                object: {example: 'instance'},
            }
        `,
    },
    {
        name: 'with multiple nested arrays',
        // prettier-ignore
        code: `
            {
                hello: 'there',
                stuff: ['a', 'b', ['f', 'g', 'h', 'i', 'j'], 'c', 'd', 'e', ['f', 'g', 'h', 'i', 'j']],
                object: {example: 'instance'}
            }
        `,
        expected: `
            {
                hello: 'there',
                stuff: [
                    'a',
                    'b',
                    [
                        'f',
                        'g',
                        'h',
                        'i',
                        'j',
                    ],
                    'c',
                    'd',
                    'e',
                    [
                        'f',
                        'g',
                        'h',
                        'i',
                        'j',
                    ],
                ],
                object: {example: 'instance'},
            }
        `,
    },
];

describe('json5 multiline array formatting', () => {
    runTests('.json', json5Tests, 'json5');
});
