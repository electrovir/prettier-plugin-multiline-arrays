import {MultilineArrayTest, runTests} from './test-config';

const typescriptTests: MultilineArrayTest[] = [
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
];

describe('json multiline array formatting', () => {
    runTests('.json', typescriptTests);
});
