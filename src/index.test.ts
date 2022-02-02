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

const tests: {code: string; expected?: string; parser?: string; force?: true}[] = [
    {
        code: `const varNoLine = ['a', 'b'];
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
        expected: `const varNoLine = [
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
        code: `// ${lineContainsTriggerComment} 2 1 3
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
        expected: `// ${lineContainsTriggerComment} 2 1 3
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
        code: `/**
 * ${lineContainsTriggerComment} 2 1
 * 3
 */
const setNumberPerLine = [
    'a', 'b',
    'c',
    'd',
    'e',
];`,
        expected: `/**
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
        code: `const nestedArray = [
    'q', 'r',
    ['s', 't'],
];`,
        expected: `const nestedArray = [
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
        code: `const myVar1: string[] = [];
`,
    },
    {
        code: `let anotherThing: string[] = ['1 1'];`,
        expected: `let anotherThing: string[] = [
    '1 1',
];
`,
    },
    {
        code: `let anotherThing: string[] = ['1 1'
];`,
        expected: `let anotherThing: string[] = [
    '1 1',
];
`,
    },
    {
        code: `
const myVar2: string[] = [];
let anotherThing: string[] = ['1 1'];
let anotherThing2: string[] = ['1 1'
];
const also: string[] = [
    '2, 1',
    '2, 2',
];`,
        expected: `const myVar2: string[] = [];
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
        code: `const myVar: string[] = ['hello'];`,
        expected: `const myVar: string[] = [
    'hello',
];
`,
    },
    {
        code: `const myVar: string[] = ['hello', 'there'];`,
        expected: `const myVar: string[] = [
    'hello',
    'there',
];
`,
    },
    {
        code: `const myVar:string=
'hello';`,
        expected: `const myVar: string = 'hello';
`,
    },
    {
        code: `const myVar: object = {a: 'here', b: 'there'};
`,
    },
    {
        code: `const myVar: object = {
    a: 'here',
    b: 'there',
};
`,
    },
    // the following test caught that path.getValue() can return undefined.
    {
        code: `function doStuff() {}

const what = ['a', 'b'];



`,
        expected: `function doStuff() {}

const what = [
    'a',
    'b',
];
`,
    },
    {
        code: `const myVar: object = {a: 'where', b: 'everywhere'};
`,
        parser: 'typescript',
    },
    {
        code: `const myVar: object = {
    a: 'where',
    b: 'everywhere',
};
`,
        parser: 'typescript',
    },
];

let forced = false;

describe('plugin formatting', () => {
    tests.forEach((test, index) => {
        const testCallback = () => {
            const expected = test.expected ?? test.code;
            const formatted = format(test.code, test.parser);
            if (formatted !== expected) {
                console.log(formatted);
            }
            expect(formatted).toBe(expected);
        };

        if (test.force) {
            forced = true;
            fit(`should pass test ${index}`, testCallback);
        } else {
            it(`should pass test ${index}`, testCallback);
        }
    });
});

describe('forced tests', () => {
    const testCallback = forced ? fit : it;

    testCallback('should not remain in the code', () => {
        expect(forced).toBe(false);
    });
});
