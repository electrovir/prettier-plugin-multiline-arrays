import {BuiltInParserName, format as prettierFormat, LiteralUnion} from 'prettier';
import {parserName} from './names';
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
    }).trim();
}

const tests: {code: string; expected?: string; parser?: string; force?: true}[] = [
    {
        code: `const myVar: string[] = [];`,
    },
    {
        code: `let anotherThing: string[] = ['1 1'];`,
        expected: `let anotherThing: string[] = [
    '1 1',
];`,
    },
    {
        code: `let anotherThing: string[] = ['1 1'
];`,
        expected: `let anotherThing: string[] = [
    '1 1',
];`,
    },
    {
        code: `
const myVar: string[] = [];
let anotherThing: string[] = ['1 1'];
let anotherThing2: string[] = ['1 1'
];
const also: string[] = [
    '2, 1',
    '2, 2',
];`,
        expected: `const myVar: string[] = [];
let anotherThing: string[] = [
    '1 1',
];
let anotherThing2: string[] = [
    '1 1',
];
const also: string[] = [
    '2, 1',
    '2, 2',
];`,
    },
    {
        code: `const myVar: string[] = ['hello'];`,
        expected: `const myVar: string[] = [
    'hello',
];`,
    },
    {
        code: `const myVar: string[] = ['hello', 'there'];`,
        expected: `const myVar: string[] = [
    'hello',
    'there',
];`,
    },
    {
        code: `const myVar:string=
'hello';`,
        expected: `const myVar: string = 'hello';`,
    },
    {
        code: `const myVar: object = {a: 'here', b: 'there'};`,
    },
    {
        code: `const myVar: object = {
    a: 'here',
    b: 'there',
};`,
    },
    {
        code: `const myVar: object = {a: 'here', b: 'there'};`,
        parser: 'typescript',
    },
    {
        code: `const myVar: object = {
    a: 'here',
    b: 'there',
};`,
        parser: 'typescript',
    },
];

let forced = false;

describe('plugin formatting', () => {
    tests.forEach((test, index) => {
        const testCallback = () => {
            const expected = test.expected ?? test.code;
            expect(format(test.code, test.parser)).toBe(expected);
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
