import {nextWrapThresholdComment} from '../options';
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
            // ${nextWrapThresholdComment} 3
            ["hello"]
        `,
    },
    {
        name: 'invalid wrap threshold triggers error',
        code: `
            ["hello"]
        `,
        options: {
            multilineArraysWrapThreshold: 'fifty two' as any,
        },
        failureMessage:
            'Invalid multilineArraysWrapThreshold value. Expected an integer, but received "fifty two".',
    },
    {
        name: 'exact code desired by Robinfr',
        code: `
            [
                ["thing1"],
                ["thing2"]
            ]
        `,
        options: {
            multilineArraysWrapThreshold: 1,
        },
    },
    {
        name: 'wrap threshold through options',
        code: `
            ["hello"]
        `,
        options: {
            multilineArraysWrapThreshold: 3,
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
            multilineArraysLinePattern: '1 2 3',
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
            multilineArraysLinePattern: '1 2 3',
            multilineArraysWrapThreshold: 20,
        },
    },
    {
        name: 'pointless wrap threshold comment',
        code: `
            // ${nextWrapThresholdComment} 0
            [
                "hello"
            ]
        `,
    },
    {
        name: 'should leave trailing newline',
        code: `
            {
                "import": ".cspell-base.json",
                "words": [
                    "estree",
                    "hardline",
                    "jsplugin",
                    "mmultiline",
                    "vite"
                ]
            }
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
    {
        name: 'basic JSON array with a comment',
        code: `
            {
                "data": [
                    "one",
                    // comment
                    "two"
                ]
            }
        `,
    },
];

describe('json multiline array formatting', () => {
    runTests('.json', jsonTests);
});
