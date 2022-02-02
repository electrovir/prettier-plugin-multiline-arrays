import {BuiltInParserName, format as prettierFormat, LiteralUnion} from 'prettier';
import {lineContainsTriggerComment, parserName} from './names';
import {repoConfig} from './prettier-config-for-tests';

function format(
    code: string,
    parser: LiteralUnion<BuiltInParserName, string> = parserName,
): string {
    return prettierFormat(code, {
        ...repoConfig,
        parser,
        filepath: 'blah.ts',
        plugins: ['.'],
    });
}

const tests: {name: string; code: string; expected?: string; parser?: string; force?: true}[] = [
    {
        name: 'multiple arrays and even one with a trigger comment',
        code: `
            const varNoLine = ['a', 'b'];
            const varOneNewLine = [
                'a', 'b',
            ];
            const nestedArray = [
                'q', 'r',
                ['s', 't'],
            ];
            /**
             * ${lineContainsTriggerComment} 2 1
             * 3
             */
            const setNumberPerLine = [
                'a', 'b',
                'c',
                'd',
                'e',
            ];

            `,
        expected: `
            const varNoLine = [
                'a',
                'b',
            ];
            const varOneNewLine = [
                'a',
                'b',
            ];
            const nestedArray = [
                'q',
                'r',
                [
                    's',
                    't',
                ],
            ];
            /**
             * ${lineContainsTriggerComment} 2 1
             * 3
             */
            const setNumberPerLine = [
                'a', 'b',
                'c',
                'd', 'e',
            ];
            `,
    },
    {
        name: 'array with single line trigger comment',
        code: `
        // ${lineContainsTriggerComment} 2 1 3
        const setNumberPerLine = [
            'a', 'b',
            'c',
            'd',
            'e',
            'f',
            'g',
            'h',
            'i',
            'j',
            'k',
        ];`,
        expected: `
            // ${lineContainsTriggerComment} 2 1 3
            const setNumberPerLine = [
                'a', 'b',
                'c',
                'd', 'e', 'f',
                'g', 'h',
                'i',
                'j', 'k',
            ];
            `,
    },
    {
        name: 'array with JSDoc style trigger comment spread across multiple lines',
        code: `
            /**
            * ${lineContainsTriggerComment} 2 1
            * 3
            */
            const setNumberPerLine = [
                'a', 'b',
                'c',
                'd',
                'e',
            ];`,
        expected: `
            /**
             * ${lineContainsTriggerComment} 2 1
             * 3
             */
            const setNumberPerLine = [
                'a', 'b',
                'c',
                'd', 'e',
            ];
            `,
    },
    {
        name: 'nested array',
        code: `
            const nestedArray = [
                'q', 'r',
                ['s', 't'],
            ];`,
        expected: `
            const nestedArray = [
                'q',
                'r',
                [
                    's',
                    't',
                ],
            ];
            `,
    },
    {
        name: 'empty array',
        code: `
            const myVar1: string[] = [];
            `,
    },
    {
        name: 'single element array on one line',
        code: `let anotherThing: string[] = ['1 1'];`,
        expected: `
            let anotherThing: string[] = [
                '1 1',
            ];
            `,
    },
    {
        name: 'single element array on multiple lines',
        code: `
            let anotherThing: string[] = ['1 1'
            ];`,
        expected: `
            let anotherThing: string[] = [
                '1 1',
            ];
            `,
    },
    {
        name: 'multiple different styled arrays all together',
        code: `
            const myVar2: string[] = [];
            let anotherThing: string[] = ['1 1'];
            let anotherThing2: string[] = ['1 1'
            ];
            const also: string[] = [
                '2, 1',
                '2, 2',
            ];`,
        expected: `
            const myVar2: string[] = [];
            let anotherThing: string[] = [
                '1 1',
            ];
            let anotherThing2: string[] = [
                '1 1',
            ];
            const also: string[] = [
                '2, 1',
                '2, 2',
            ];
            `,
    },
    {
        name: 'single element string array with type definition',
        code: `const myVar: string[] = ['hello'];`,
        expected: `
            const myVar: string[] = [
                'hello',
            ];
            `,
    },
    {
        name: 'double element string array with type definition',
        code: `const myVar: string[] = ['hello', 'there'];`,
        expected: `
            const myVar: string[] = [
                'hello',
                'there',
            ];
            `,
    },
    {
        name: 'non-array string assignment',
        code: `
            const myVar:string=
            'hello';`,
        expected: `
            const myVar: string = 'hello';
            `,
    },
    {
        name: 'non-array single line object assignment',
        code: `
            const myVar: object = {a: 'here', b: 'there'};
            `,
    },
    {
        name: 'non-array multi-line object assignment',
        code: `
            const myVar: object = {
                a: 'here',
                b: 'there',
            };
            `,
    },
    // the following test caught that path.getValue() can return undefined.
    {
        name: 'array with an earlier function definition',
        code: `
            function doStuff() {}

            const what = ['a', 'b'];



            `,
        expected: `
            function doStuff() {}

            const what = [
                'a',
                'b',
            ];
            `,
    },
    {
        name: 'array with function definition inside of it',
        code: `
            const what = ['a', function doStuff() {}];
            `,
        expected: `
            const what = [
                'a',
                function doStuff() {},
            ];
            `,
    },
    {
        name: 'original parser with single line object assignment',
        code: `
            const myVar: object = {a: 'where', b: 'everywhere'};
            `,
        parser: 'typescript',
    },
    {
        name: 'original parser with multi-line object assignment',
        code: `
            const myVar: object = {
                a: 'where',
                b: 'everywhere',
            };
            `,
        parser: 'typescript',
    },
];

let forced = false;

function removeIndent(input: string): string {
    return input.replace(/^\s*\n\s*/, '').replace(/\n {12}/g, '\n');
}

describe('plugin formatting', () => {
    tests.forEach((test) => {
        const testCallback = () => {
            const inputCode = removeIndent(test.code);
            const expected = removeIndent(test.expected ?? inputCode);
            const formatted = format(inputCode, test.parser);
            if (formatted !== expected) {
                console.log(formatted);
            }
            expect(formatted).toBe(expected);
        };

        if (test.force) {
            forced = true;
            fit(test.name, testCallback);
        } else {
            it(test.name, testCallback);
        }
    });
});

describe('forced tests', () => {
    const testCallback = forced ? fit : it;

    testCallback('should not remain in the code', () => {
        expect(forced).toBe(false);
    });
});
