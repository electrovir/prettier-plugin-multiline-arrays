import {elementWrapThreshold} from '../options';
import {MultilineArrayTest, runTests} from './run-tests';

const jsonTests: MultilineArrayTest[] = [
    {
        name: 'basic JSON format',
        // prettier-ignore
        code: `
            {
                "hello": "there",
                "stuff": ["a", "b", "c", "d", "e"],
                "object": {"example": "instance"}
            }
        `,
        expected: `
            {
                "hello": "there",
                "object": {
                    "example": "instance"
                },
                "stuff": [
                    "a",
                    "b",
                    "c",
                    "d",
                    "e"
                ]
            }
        `,
    },
    {
        name: 'basic wrap threshold comment',
        code: `
            // ${elementWrapThreshold} 3
            ["hello"]
        `,
    },
    {
        name: 'invalid wrap threshold triggers error',
        code: `
            ["hello"]
        `,
        options: {
            multilineArrayWrapThreshold: 'fifty two' as any,
        },
        failureMessage:
            'Invalid \x1B[31mmultilineArrayWrapThreshold\x1B[39m value. Expected \x1B[34man integer\x1B[39m, but received \x1B[31m"fifty two"\x1B[39m.',
    },
    {
        name: 'wrap threshold through options',
        code: `
            ["hello"]
        `,
        options: {
            multilineArrayWrapThreshold: 3,
        },
    },
    {
        name: 'line count through options',
        code: `
            ["a", "b", "c", "d", "e", "f", "g", "h"]
        `,
        expected: `
            [
                "a",
                "b", "c",
                "d", "e", "f",
                "g",
                "h"
            ]
        `,
        options: {
            elementsPerLinePattern: [
                1,
                2,
                3,
            ],
        },
    },
    {
        name: 'line count overrides threshold',
        code: `
            ["a", "b", "c", "d", "e", "f", "g", "h"]
        `,
        expected: `
            [
                "a",
                "b", "c",
                "d", "e", "f",
                "g",
                "h"
            ]
        `,
        options: {
            elementsPerLinePattern: [
                1,
                2,
                3,
            ],
            multilineArrayWrapThreshold: 20,
        },
    },
    {
        name: 'pointless wrap threshold comment',
        code: `
            // ${elementWrapThreshold} 0
            [
                "hello"
            ]
        `,
    },
    {
        name: 'with object array element',
        // prettier-ignore
        code: `
            {
                "hello": "there",
                "stuff": ["a", "b", "c", "d", "e", {"example": "instance"}],
                "object": {"example": "instance"}
            }
        `,
        expected: `
            {
                "hello": "there",
                "object": {
                    "example": "instance"
                },
                "stuff": [
                    "a",
                    "b",
                    "c",
                    "d",
                    "e",
                    {
                        "example": "instance"
                    }
                ]
            }
        `,
    },
    {
        name: 'with nested array',
        // prettier-ignore
        code: `
            {
                "hello": "there",
                "stuff": ["a", "b", "c", "d", "e", ["f", "g", "h", "i", "j"]],
                "object": {"example": "instance"}
            }
        `,
        expected: `
            {
                "hello": "there",
                "object": {
                    "example": "instance"
                },
                "stuff": [
                    "a",
                    "b",
                    "c",
                    "d",
                    "e",
                    [
                        "f",
                        "g",
                        "h",
                        "i",
                        "j"
                    ]
                ]
            }
        `,
    },
    {
        name: 'with multiple nested arrays',
        // prettier-ignore
        code: `
            {
                "hello": "there",
                "stuff": ["a", "b", ["f", "g", "h", "i", "j"], "c", "d", "e", ["f", "g", "h", "i", "j"]],
                "object": {"example": "instance"}
            }
        `,
        expected: `
            {
                "hello": "there",
                "object": {
                    "example": "instance"
                },
                "stuff": [
                    "a",
                    "b",
                    [
                        "f",
                        "g",
                        "h",
                        "i",
                        "j"
                    ],
                    "c",
                    "d",
                    "e",
                    [
                        "f",
                        "g",
                        "h",
                        "i",
                        "j"
                    ]
                ]
            }
        `,
    },
];

describe('json multiline array formatting', () => {
    runTests('.json', jsonTests);
});
