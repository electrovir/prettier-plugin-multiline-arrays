import {describe} from 'mocha';
import {capitalizeFirst} from '../augments/string';
import {nextLinePatternComment, nextWrapThresholdComment} from '../options';
import {MultilineArrayTest, runTests} from './run-tests';

const javascriptTests: MultilineArrayTest[] = [
    {
        it: 'comment at end of argument list with multiline array parser',
        // prettier-ignore
        code: `
            export function hasProperty(
                inputObject,
                inputKey,
                // this comment shouldn't get moved
            ) {
                return inputKey in inputObject;
            }
        `,
    },
    {
        it: 'long args that wrap already',
        code: `
            doTheThing('super long argument to force some wrapping', 'super long argument to force some wrapping', 'super long argument to force some wrapping');
        `,
        expect: `
            doTheThing(
                'super long argument to force some wrapping',
                'super long argument to force some wrapping',
                'super long argument to force some wrapping',
            );
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        // caught
        it: 'arguments in function call',
        code: `
            doTheThing('a123', 'b123', 'c123');
        `,
        expect: `
            doTheThing(
                'a123',
                'b123',
                'c123',
            );
        `,
        options: {
            multilineFunctionArguments: true,
        },
        exclude: true,
    },
    {
        // caught
        it: 'assigned function call',
        code: `
            const output = doThing('a9', 'b999');
        `,
        expect: `
        const output = doThing(
                'a9',
                'b999',
            );
        `,
        options: {
            multilineFunctionArguments: true,
        },
        exclude: true,
    },
    {
        it: 'require call',
        code: `
            const output = require('path/to/thing');
        `,
        expect: `
            const output = require('path/to/thing');
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        it: 'single arg arrow function',
        code: `
            const stuff = process.argv.some((argP) => argO.match(/\.tsq?$/));
        `,
        expect: `
            const stuff = process.argv.some((argP) => argO.match(/\.tsq?$/));
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        it: 'multi arg arrow function with call in callback',
        code: `
            const stuff = process.argv.some((argB, indexB) => argC.match(/\.tsg?$/));
        `,
        expect: `
            const stuff = process.argv.some(
                (
                    argB,
                    indexB,
                ) => argC.match(/\.tsg?$/)
            );
        `,
        exclude: true,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        it: 'multi arg arrow function',
        exclude: true,
        code: `
            const stuff = process.argv.some((arg2, index3) => arg1);
        `,
        expect: `
            const stuff = process.argv.some(
                (
                    arg2,
                    index3,
                ) => arg1,
            );
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        it: 'tons of args in arrow function',
        code: `
            const stuff = process.argv.some((reallyReallyReallyReallyReallyReallyReallyLong, reallyReallyReallyReallyReallyReallyReallyLong, reallyReallyReallyReallyReallyReallyReallyLong) => arg.match(/\.tsx?$/));
        `,
        expect: `
            const stuff = process.argv.some(
                (
                    reallyReallyReallyReallyReallyReallyReallyLong,
                    reallyReallyReallyReallyReallyReallyReallyLong,
                    reallyReallyReallyReallyReallyReallyReallyLong,
                ) => arg.match(/\.tsx?$/),
            );
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        it: 'arguments in new constructor call',
        code: `
            new doTheThing('aq', 'bq', 'cq');
        `,
        expect: `
            new doTheThing(
                'aq',
                'bq',
                'cq',
            );
        `,
        options: {
            multilineFunctionArguments: true,
        },
        exclude: true,
    },
    {
        it: 'arguments in function definition',
        code: `
            function doTheThing(a1, b2, c3) {};
        `,
        expect: `
            function doTheThing(
                a1,
                b2,
                c3,
            ) {}
        `,
        options: {
            multilineFunctionArguments: true,
        },
        exclude: true,
    },
    {
        it: 'arguments in function definition no wrap when below threshold',
        code: `
            function doTheThing(aa, bb, cc) {};
        `,
        expect: `
            function doTheThing(aa, bb, cc) {}
        `,
        options: {
            multilineFunctionArguments: true,
            multilineArraysWrapThreshold: 10,
        },
    },
    {
        it: 'basic wrap threshold comment',
        code: `
            // ${nextWrapThresholdComment} 3
            const thingieArray = ['hello'];
        `,
    },
    {
        it: 'works with greater than or less than inside of an array in javascript',
        code: `
            const thingie = [
                otherThingie < 5 ? 'owl' : 'goat',
            ];
        `,
    },
    {
        it: 'invalid wrap threshold triggers error',
        code: `
            const thingieArray = ['hello'];
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
            const thingieArray = ['hello'];
        `,
        options: {
            multilineArraysWrapThreshold: 3,
        },
    },
    {
        it: 'line count through options',
        code: `
            const thingieArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        `,
        expect: `
            const thingieArray = [
                'a',
                'b', 'c',
                'd', 'e', 'f',
                'g',
                'h',
            ];
        `,
        options: {
            multilineArraysLinePattern: '1 2 3',
        },
    },
    {
        it: 'line count overrides threshold',
        code: `
            const thingieArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        `,
        expect: `
            const thingieArray = [
                'a',
                'b', 'c',
                'd', 'e', 'f',
                'g',
                'h',
            ];
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
            const thingieArray = [
                'hello',
            ];
        `,
    },
    {
        // this was causing an error on the closing "}" at one point
        it: 'interpolated string example',
        code: `
            if (children.length) {
                // ${nextWrapThresholdComment} 1
                return [\`\${input.type}:\`];
            }
        `,
    },
    {
        it: 'array elements with dots',
        // prettier-ignore
        code: `
            parentDoc[childIndex] = [
                doc.builders.hardlineWithoutBreakParent,
                doc.builders.breakParent,
            ];
        `,
    },
    {
        it: 'single line comment with just one line count',
        // prettier-ignore
        code: `
            // ${nextLinePatternComment} 2
            const originalArray = [
                0,
                1,
                2,
                3,
                4,
            ];
        `,
        expect: `
            // ${nextLinePatternComment} 2
            const originalArray = [
                0, 1,
                2, 3,
                4,
            ];
        `,
    },
    {
        it: 'single line comment with just one line wrapped',
        // prettier-ignore
        code: `
            describe(filterMap.name, () => {
                // ${nextLinePatternComment} 2
                const originalArray = [
                    0,
                    1,
                    2,
                    3,
                    4,
                ];
            });
        `,
        expect: `
            describe(filterMap.name, () => {
                // ${nextLinePatternComment} 2
                const originalArray = [
                    0, 1,
                    2, 3,
                    4,
                ];
            });
        `,
    },
    {
        // caused a max call stack exceeded error once
        it: 'single object element with multiline template',
        // prettier-ignore
        code: `
        
        
        
        
            const stuff = [
            
            
                {
                    innerStuff: \`
                        const myVar = {a: 'where', b: 'everywhere'};
                    \`,
                },
            ];
        `,
        // prettier-ignore
        expect: `
            const stuff = [
                {
                    innerStuff: \`
                        const myVar = {a: 'where', b: 'everywhere'};
                    \`,
                },
            ];
        `,
    },
    {
        it: 'long function definition with multiline array parser',
        // prettier-ignore
        code: `
            export async function selectFiles(
                inputProperties = [
                    OpenDialogProperty.multiSelections,
                    OpenDialogProperty.openFile,
                    OpenDialogProperty.openDirectory,
                ],
            ) {}
        `,
    },
    {
        it: 'comment after end of block with multiline array parser',
        // prettier-ignore
        code: `
            if (thing) {
            }
            // otherwise we are editing currently existing songs
            else {
            }
        `,
    },
    {
        it: 'should still sort imports with multiline parser',
        // prettier-ignore
        code: `
            import {notUsed} from 'blah';
            const thingie = [
                'a',
                'b',
            ];
        `,
        expect: `
            const thingie = [
                'a',
                'b',
            ];
        `,
    },
    {
        it: 'deep array call should include trailing comma still',
        // prettier-ignore
        code: `
            expect(createArrayValidator(typeofValidators.boolean)([3, 4])).toBe(false);
        `,
        // prettier-ignore
        expect: `
            expect(
                createArrayValidator(typeofValidators.boolean)([
                    3,
                    4,
                ]),
            ).toBe(false);
        `,
        options: {
            multilineArraysWrapThreshold: 1,
        },
    },
    {
        it: 'not arrays but callbacks with multiline array parser',
        // prettier-ignore
        code: `
            expose({
                versions,
                apiRequest: async (details) => {
                    async function waitForResponse() {
                        return new Promise((resolve) => {
                            ipcRenderer.once(
                                getApiResponseEventName(details.type, requestId),
                                (event, data) => {
                                    resolve(data);
                                },
                            );
                        });
                    }
                },
            });
        `,
    },
    {
        it: 'function parameters',
        // prettier-ignore
        code: `
            doTheThing('a', 'b', 'c');
        `,
    },
    {
        it: 'config object',
        // prettier-ignore
        code: `
            const config = {
                directories: {
                    output: 'dist',
                    buildResources: 'build-resources',
                },
                files: [
                    'packages/**/dist/**',
                ],
                extraMetadata: {
                    version: viteVersion,
                },
            };
        `,
    },
    {
        it: 'nested single-line objects on multiple lines',
        // prettier-ignore
        code: `
            const nested = [
                {success: true, filePath: ''},
                {success: false, error: 'hello there', filePath: ''},
                {success: false, error: '', filePath: ''},
            ];
        `,
    },
    {
        it: 'nested single-line objects all on one line',
        // prettier-ignore
        code: `
            const nested = [{success: true, filePath: ''}, {success: false, error: 'hello there', filePath: ''}, {success: false, error: '', filePath: ''}];
        `,
        // prettier-ignore
        expect: `
            const nested = [
                {success: true, filePath: ''},
                {success: false, error: 'hello there', filePath: ''},
                {success: false, error: '', filePath: ''},
            ];
        `,
    },
    {
        it: 'nested multi-line objects',
        // prettier-ignore
        code: `
            const nested = [{
                success: true, filePath: ''}, {
                    success: false, error: 'hello there', filePath: ''}, {
                        success: false, error: '', filePath: ''}];
        `,
        // prettier-ignore
        expect: `
            const nested = [
                {
                    success: true,
                    filePath: '',
                },
                {
                    success: false,
                    error: 'hello there',
                    filePath: '',
                },
                {
                    success: false,
                    error: '',
                    filePath: '',
                },
            ];
        `,
    },
    {
        it: 'multiple arrays and even one with a trigger comment',
        // prettier-ignore
        code: `
            const varNoLine = ['a', 'b'];
            const varOneNewLine = [
                'a', 'b',
            ];
            const nestedArray = [
                'q', 'r',
                ['s', 't'],
            ];
            // ${capitalizeFirst(nextLinePatternComment)} 2 1 3
            const setNumberPerLine = [
                'a', 'b',
                'c',
                'd',
                'e',
            ];

        `,
        // prettier-ignore
        expect: `
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
            // ${capitalizeFirst(nextLinePatternComment)} 2 1 3
            const setNumberPerLine = [
                'a', 'b',
                'c',
                'd', 'e',
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 1,
        },
    },
    {
        it: 'no threshold set with multiple arrays, one having a trigger comment',
        // prettier-ignore
        code: `
            const varNoLine = ['a', 'b'];
            const varOneNewLine = [
                'a', 'b',
            ];
            const nestedArray = [
                'q', 'r',
                ['s', 't'],
            ];
            // ${capitalizeFirst(nextLinePatternComment)} 2 1 3
            const setNumberPerLine = [
                'a', 'b',
                'c',
                'd',
                'e',
            ];

        `,
        // prettier-ignore
        expect: `
            const varNoLine = ['a', 'b'];
            const varOneNewLine = [
                'a',
                'b',
            ];
            const nestedArray = [
                'q',
                'r',
                ['s', 't'],
            ];
            // ${capitalizeFirst(nextLinePatternComment)} 2 1 3
            const setNumberPerLine = [
                'a', 'b',
                'c',
                'd', 'e',
            ];
        `,
    },
    {
        it: 'array with single line trigger comment',
        // prettier-ignore
        code: `
        // ${nextLinePatternComment} 2 1 3
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
        // prettier-ignore
        expect: `
            // ${(nextLinePatternComment)} 2 1 3
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
        it: 'array with line trigger comment using commas',
        // prettier-ignore
        code: `
        // ${nextLinePatternComment} 2, 1, 3
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
        // prettier-ignore
        expect: `
            // ${nextLinePatternComment} 2, 1, 3
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
        it: 'JS array with just a comment',
        code: `
            const myObject = {
                data: [
                    // comment
                ],
            };
      `,
    },
    {
        it: 'basic array with a comment',
        code: `
            const data = [
                'one',
                // comment
                'two',
            ];
        `,
    },
    {
        it: 'basic array with a leading comment',
        code: `
            const data = [
                // comment
                'one',
                'two',
            ];
        `,
    },
    {
        it: 'nested array',
        // prettier-ignore
        code: `
            const nestedArray = [
                'q', 'r',
                ['s', 't'],
            ];`,
        // prettier-ignore
        expect: `
            const nestedArray = [
                'q',
                'r',
                [
                    's',
                    't',
                ],
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 1,
        },
    },
    {
        it: 'empty array',
        // prettier-ignore
        code: `
            const myVar1: string[] = [];
        `,
    },
    {
        it: 'single element array on one line',
        // prettier-ignore
        code: `let anotherThing: string[] = ['1 1'];`,
        // prettier-ignore
        expect: `
            let anotherThing: string[] = [
                '1 1',
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        it: 'single element array on multiple lines',
        // prettier-ignore
        code: `
            let anotherThing: string[] = ['1 1'
            ];`,
        // prettier-ignore
        expect: `
            let anotherThing: string[] = [
                '1 1',
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        it: 'multiple different styled arrays all together',
        // prettier-ignore
        code: `
            const myVar2: string[] = [];
            let anotherThing: string[] = ['1 1'];
            let anotherThing2: string[] = ['1 1'
            ];
            const also: string[] = [
                '2, 1',
                '2, 2',
            ];`,
        // prettier-ignore
        expect: `
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
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        it: 'single element string array with type definition',
        // prettier-ignore
        code: `const myVar: string[] = ['hello'];`,
        // prettier-ignore
        expect: `
            const myVar: string[] = [
                'hello',
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        it: 'double element string array with type definition',
        // prettier-ignore
        code: `const myVar: string[] = ['hello', 'there'];`,
        // prettier-ignore
        expect: `
            const myVar: string[] = [
                'hello',
                'there',
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 1,
        },
    },
    {
        it: 'non-array string assignment',
        // prettier-ignore
        code: `
            const myVar:string=
            'hello';`,
        // prettier-ignore
        expect: `
            const myVar: string = 'hello';
        `,
    },
    {
        it: 'non-array single line object assignment',
        // prettier-ignore
        code: `
            const myVar: object = {a: 'here', b: 'there'};
        `,
    },
    {
        it: 'non-array multi-line object assignment',
        // prettier-ignore
        code: `
            const myVar: object = {
                a: 'here',
                b: 'there',
            };
        `,
    },
    // the following test caught that path.getValue() can return undefined.
    {
        it: 'array with an earlier function definition',
        // prettier-ignore
        code: `
            function doStuff() {}

            const what = ['a', 'b'];



        `,
        // prettier-ignore
        expect: `
            function doStuff() {}

            const what = [
                'a',
                'b',
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 1,
        },
    },
    {
        it: 'array with function definition inside of it',
        // prettier-ignore
        code: `
            const what = ['a', function doStuff() {}];
        `,
        // prettier-ignore
        expect: `
            const what = [
                'a',
                function doStuff() {},
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 1,
        },
    },
    {
        it: 'original parser with single line object assignment',
        // prettier-ignore
        code: `
            const myVar: object = {a: 'where', b: 'everywhere'};
        `,
    },
    {
        it: 'original parser with multi-line object assignment',
        // prettier-ignore
        code: `
            const myVar: object = {
                a: 'where',
                b: 'everywhere',
            };
        `,
    },
];

describe('javascript multiline array formatting', () => {
    runTests('.js', javascriptTests, 'babel');
});
