import {MultilineArrayTest, runTests} from './test-config';

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
