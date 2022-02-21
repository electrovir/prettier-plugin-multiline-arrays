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
            'Invalid multilineArrayWrapThreshold value. Expected an integer, but received "fifty two".',
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
            multilineArrayWrapThreshold: 1,
        },
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
            multilineArrayElementsPerLine: '1 2 3',
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
            multilineArrayElementsPerLine: '1 2 3',
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
];

describe('json multiline array formatting', () => {
    runTests('.json', jsonTests);
});
