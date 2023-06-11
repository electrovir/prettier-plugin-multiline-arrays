import {describe} from 'mocha';
import {nextWrapThresholdComment} from '../options';
import {MultilineArrayTest, runTests} from './run-tests';

const jsonTests: MultilineArrayTest[] = [
    {
        it: 'basic JSON format',
        // prettier-ignore
        code: `
            {
                "hello": "there",
                "stuff": ["a", "b", "c", "d", "e"],
                "object": {"example": "instance"}
            }
        `,
        expect: `
            {
                "hello": "there",
                "object": {"example": "instance"},
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
        it: 'should format tsconfig.json keys still',
        code: `
            {
                "exclude": [
                    "./configs",
                    "./coverage",
                    "./dist",
                    "./node_modules",
                    "./test-files"
                ],
                "compilerOptions": {
                    "outDir": "./dist",
                    "rootDir": "./src"
                }
            }
        `,
        expect: `
            {
                "compilerOptions": {
                    "outDir": "./dist",
                    "rootDir": "./src"
                },
                "exclude": [
                    "./configs",
                    "./coverage",
                    "./dist",
                    "./node_modules",
                    "./test-files"
                ]
            }
        `,
    },
    {
        it: 'basic wrap threshold comment',
        code: `
            // ${nextWrapThresholdComment} 3
            ["hello"]
        `,
    },
    {
        it: 'invalid wrap threshold triggers error',
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
        it: 'exact code desired by Robinfr',
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
        it: 'wrap threshold through options',
        code: `
            ["hello"]
        `,
        options: {
            multilineArraysWrapThreshold: 3,
        },
    },
    {
        it: 'line count through options',
        code: `
            ["a", "b", "c", "d", "e", "f", "g", "h"]
        `,
        expect: `
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
        it: 'line count overrides threshold',
        code: `
            ["a", "b", "c", "d", "e", "f", "g", "h"]
        `,
        expect: `
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
        it: 'pointless wrap threshold comment',
        code: `
            // ${nextWrapThresholdComment} 0
            [
                "hello"
            ]
        `,
    },
    {
        it: 'should leave trailing newline',
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
        // TODO: this test is weird, it won't work if the newline before "example" isn't there
        it: 'with object array element',
        // prettier-ignore
        code: `
            {
                "hello": "there",
                "stuff": ["a", "b", "c", "d", "e", {
                    "example": "instance"}],
                "object": {"example": "instance"}
            }
        `,
        expect: `
            {
                "hello": "there",
                "object": {"example": "instance"},
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
        it: 'with nested array',
        // prettier-ignore
        code: `
            {
                "hello": "there",
                "stuff": ["a", "b", "c", "d", "e", ["f", "g", "h", "i", "j"]],
                "object": {"example": "instance"}
            }
        `,
        expect: `
            {
                "hello": "there",
                "object": {"example": "instance"},
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
        it: 'with multiple nested arrays',
        // prettier-ignore
        code: `
            {
                "hello": "there",
                "stuff": ["a", "b", ["f", "g", "h", "i", "j"], "c", "d", "e", ["f", "g", "h", "i", "j"]],
                "object": {"example": "instance"}
            }
        `,
        expect: `
            {
                "hello": "there",
                "object": {"example": "instance"},
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
        it: 'basic JSON array with a comment',
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
    {
        it: 'basic JSON array with multiple comments',
        code: `
            {
                // comment
                "data": [
                    // comment
                    "one",
                    // comment
                    "two"
                    // comment
                ]
                // comment
            }
            // comment
        `,
    },
    {
        it: 'basic JSON array with multiline comments',
        code: `
            {
                /*
                    comment
                    comment
                    comment
                */
                "data": [
                    /*
                        comment
                        comment
                        comment
                    */
                    "one",
                    /*
                        comment
                        comment
                        comment
                    */
                    "two"
                    /*
                        comment
                        comment
                        comment
                    */
                ]
                /*
                    comment
                    comment
                    comment
                */
            }
            /*
                comment
                comment
                comment
            */
        `,
    },
    {
        it: 'basic JSON array',
        code: `
            {
                "data": [
                    "one",
                    "two"
                ]
            }
        `,
    },
    {
        it: 'basic lone element JSON array',
        code: `
            {
                "data": [
                    "one one one one one one one one one one one one one one one one one one one one",
                    "two two two two two two two two two two two two two two two two two two two two"
                ]
            }
        `,
    },
];

describe('json multiline array formatting', () => {
    runTests('.json', jsonTests, 'json');
});
