import {describe} from 'mocha';
import {nextWrapThresholdComment} from '../options';
import {MultilineArrayTest, runTests} from './run-tests';

const json5Tests: MultilineArrayTest[] = [
    {
        it: 'basic JSON format',
        // prettier-ignore
        code: `
            {
                hello: 'there',
                stuff: ['a', 'b', 'c', 'd', 'e'],
                object: {example: 'instance'}
            }
        `,
        expect: `
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
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        it: 'basic wrap threshold comment',
        code: `
            // ${nextWrapThresholdComment} 3
            ['hello']
        `,
    },
    {
        it: 'invalid wrap threshold triggers error',
        code: `
            ['hello']
        `,
        options: {
            multilineArraysWrapThreshold: 'fifty two' as any,
        },
        failureMessage:
            'Invalid multilineArraysWrapThreshold value. Expected an integer, but received "fifty two".',
    },
    {
        it: 'wrap threshold through options',
        code: `
            ['hello']
        `,
        options: {
            multilineArraysWrapThreshold: 3,
        },
    },
    {
        it: 'line count through options',
        code: `
            ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        `,
        expect: `
            [
                'a',
                'b', 'c',
                'd', 'e', 'f',
                'g',
                'h',
            ]
        `,
        options: {
            multilineArraysLinePattern: '1 2 3',
        },
    },
    {
        it: 'line count overrides threshold',
        code: `
            ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        `,
        expect: `
            [
                'a',
                'b', 'c',
                'd', 'e', 'f',
                'g',
                'h',
            ]
        `,
        options: {
            multilineArraysLinePattern: '1 2 3',
            multilineArraysWrapThreshold: 20,
        },
    },
    {
        it: 'pointless wrap threshold comment',
        code: `
            // ${nextWrapThresholdComment} 0
            [
                'hello',
            ]
        `,
    },
    {
        it: 'with object array element',
        // prettier-ignore
        code: `
            {
                hello: 'there',
                stuff: ['a', 'b', 'c', 'd', 'e', {example: 'instance'}],
                object: {example: 'instance'}
            }
        `,
        expect: `
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
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        it: 'with nested array',
        // prettier-ignore
        code: `
            {
                hello: 'there',
                stuff: ['a', 'b', 'c', 'd', 'e', ['f', 'g', 'h', 'i', 'j']],
                object: {example: 'instance'}
            }
        `,
        expect: `
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
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        it: 'with multiple nested arrays',
        // prettier-ignore
        code: `
            {
                hello: 'there',
                stuff: ['a', 'b', ['f', 'g', 'h', 'i', 'j'], 'c', 'd', 'e', ['f', 'g', 'h', 'i', 'j']],
                object: {example: 'instance'}
            }
        `,
        expect: `
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
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
];

describe('json5 multiline array formatting', () => {
    runTests('.json', json5Tests, 'json5');
});
