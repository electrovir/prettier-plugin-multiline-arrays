import {capitalizeFirst} from '../augments/string';
import {nextLinePatternComment, nextWrapThresholdComment} from '../options';
import {MultilineArrayTest, runTests} from './run-tests';

const javascriptTests: MultilineArrayTest[] = [
    {
        name: 'comment at end of argument list with multiline array parser',
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
        name: 'long args that wrap already',
        code: `
            doTheThing('super long argument to force some wrapping', 'super long argument to force some wrapping', 'super long argument to force some wrapping');
        `,
        expected: `
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
        name: 'arguments in function call',
        code: `
            doTheThing('a123', 'b123', 'c123');
        `,
        expected: `
            doTheThing(
                'a123',
                'b123',
                'c123',
            );
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        // caught
        name: 'assigned function call',
        code: `
            const output = doThing('a9', 'b999');
        `,
        expected: `
        const output = doThing(
                'a9',
                'b999',
            );
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        name: 'require call',
        code: `
            const output = require('path/to/thing');
        `,
        expected: `
            const output = require('path/to/thing');
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        name: 'single arg arrow function',
        code: `
            const stuff = process.argv.some((argP) => argO.match(/\.tsq?$/));
        `,
        expected: `
            const stuff = process.argv.some((argP) => argO.match(/\.tsq?$/));
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        // caught argB
        // caught tsg tons of times
        name: 'multi arg arrow function with call in callback',
        code: `
            const stuff = process.argv.some((argB, indexB) => argC.match(/\.tsg?$/));
        `,
        expected: `
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
        name: 'multi arg arrow function',
        exclude: true,
        code: `
            const stuff = process.argv.some((arg2, index3) => arg1);
        `,
        expected: `
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
        name: 'tons of args in arrow function',
        code: `
            const stuff = process.argv.some((reallyReallyReallyReallyReallyReallyReallyLong, reallyReallyReallyReallyReallyReallyReallyLong, reallyReallyReallyReallyReallyReallyReallyLong) => arg.match(/\.tsx?$/));
        `,
        expected: `
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
        name: 'arguments in new constructor call',
        code: `
            new doTheThing('aq', 'bq', 'cq');
        `,
        expected: `
            new doTheThing(
                'aq',
                'bq',
                'cq',
            );
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        name: 'arguments in function definition',
        code: `
            function doTheThing(a1, b2, c3) {};
        `,
        expected: `
            function doTheThing(
                a1,
                b2,
                c3,
            ) {}
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        name: 'arguments in function definition no wrap when below threshold',
        code: `
            function doTheThing(aa, bb, cc) {};
        `,
        expected: `
            function doTheThing(aa, bb, cc) {}
        `,
        options: {
            multilineFunctionArguments: true,
            multilineArraysWrapThreshold: 10,
        },
    },
    {
        name: 'basic wrap threshold comment',
        code: `
            // ${nextWrapThresholdComment} 3
            const thingieArray = ['hello'];
        `,
    },
    {
        name: 'works with greater than or less than inside of an array in javascript',
        code: `
            const thingie = [
                otherThingie < 5 ? 'owl' : 'goat',
            ];
        `,
    },
    {
        name: 'invalid wrap threshold triggers error',
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
        name: 'wrap threshold through options',
        code: `
            const thingieArray = ['hello'];
        `,
        options: {
            multilineArraysWrapThreshold: 3,
        },
    },
    {
        name: 'line count through options',
        code: `
            const thingieArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        `,
        expected: `
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
        name: 'line count overrides threshold',
        code: `
            const thingieArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        `,
        expected: `
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
        name: 'pointless wrap threshold comment',
        code: `
            // ${nextWrapThresholdComment} 0
            const thingieArray = [
                'hello',
            ];
        `,
    },
    {
        // this was causing an error on the closing "}" at one point
        name: 'interpolated string example',
        code: `
            if (children.length) {
                // ${nextWrapThresholdComment} 1
                return [\`\${input.type}:\`];
            }
        `,
    },
    {
        name: 'array elements with dots',
        // prettier-ignore
        code: `
            parentDoc[childIndex] = [
                doc.builders.hardlineWithoutBreakParent,
                doc.builders.breakParent,
            ];
        `,
    },
    {
        name: 'single line comment with just one line count',
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
        expected: `
            // ${nextLinePatternComment} 2
            const originalArray = [
                0, 1,
                2, 3,
                4,
            ];
        `,
    },
    {
        name: 'single line comment with just one line wrapped',
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
        expected: `
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
        name: 'single object element with multiline template',
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
        expected: `
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
        name: 'long function definition with multiline array parser',
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
        name: 'comment after end of block with multiline array parser',
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
        name: 'should still sort imports with multiline parser',
        // prettier-ignore
        code: `
            import {notUsed} from 'blah';
            const thingie = [
                'a',
                'b',
            ];
        `,
        expected: `
            const thingie = [
                'a',
                'b',
            ];
        `,
    },
    {
        name: 'deep array call should include trailing comma still',
        // prettier-ignore
        code: `
            expect(createArrayValidator(typeofValidators.boolean)([3, 4])).toBe(false);
        `,
        // prettier-ignore
        expected: `
            expect(
                createArrayValidator(typeofValidators.boolean)([
                    3,
                    4,
                ]),
            ).toBe(false);
        `,
    },
    {
        name: 'not arrays but callbacks with multiline array parser',
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
        name: 'function parameters',
        // prettier-ignore
        code: `
            doTheThing('a', 'b', 'c');
        `,
    },
    {
        name: 'config object',
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
        name: 'nested single-line objects on multiple lines',
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
        name: 'nested single-line objects all on one line',
        // prettier-ignore
        code: `
            const nested = [{success: true, filePath: ''}, {success: false, error: 'hello there', filePath: ''}, {success: false, error: '', filePath: ''}];
        `,
        // prettier-ignore
        expected: `
            const nested = [
                {success: true, filePath: ''},
                {success: false, error: 'hello there', filePath: ''},
                {success: false, error: '', filePath: ''},
            ];
        `,
    },
    {
        name: 'nested multi-line objects',
        // prettier-ignore
        code: `
            const nested = [{
                success: true, filePath: ''}, {
                    success: false, error: 'hello there', filePath: ''}, {
                        success: false, error: '', filePath: ''}];
        `,
        // prettier-ignore
        expected: `
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
        name: 'multiple arrays and even one with a trigger comment',
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
            /**
             * ${capitalizeFirst(nextLinePatternComment)} 2 1 3
             */
            const setNumberPerLine = [
                'a', 'b',
                'c',
                'd',
                'e',
            ];

        `,
        // prettier-ignore
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
            /** ${capitalizeFirst(nextLinePatternComment)} 2 1 3 */
            const setNumberPerLine = [
                'a', 'b',
                'c',
                'd', 'e',
            ];
        `,
    },
    {
        name: 'array with single line trigger comment',
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
        expected: `
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
        name: 'array with line trigger comment using commas',
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
        expected: `
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
        name: 'array with JSDoc style trigger comment spread across multiple lines',
        // prettier-ignore
        code: `
            /**
            * ${capitalizeFirst(nextLinePatternComment)} 2 1
            * 3
            */
            const setNumberPerLine = [
                'a', 'b',
                'c',
                'd',
                'e',
            ];`,
        // prettier-ignore
        expected: `
            /** ${capitalizeFirst(nextLinePatternComment)} 2 1 3 */
            const setNumberPerLine = [
                'a', 'b',
                'c',
                'd', 'e',
            ];
        `,
    },
    {
        name: 'nested array',
        // prettier-ignore
        code: `
            const nestedArray = [
                'q', 'r',
                ['s', 't'],
            ];`,
        // prettier-ignore
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
        // prettier-ignore
        code: `
            const myVar1: string[] = [];
        `,
    },
    {
        name: 'single element array on one line',
        // prettier-ignore
        code: `let anotherThing: string[] = ['1 1'];`,
        // prettier-ignore
        expected: `
            let anotherThing: string[] = [
                '1 1',
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        name: 'single element array on multiple lines',
        // prettier-ignore
        code: `
            let anotherThing: string[] = ['1 1'
            ];`,
        // prettier-ignore
        expected: `
            let anotherThing: string[] = [
                '1 1',
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        name: 'multiple different styled arrays all together',
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
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        name: 'single element string array with type definition',
        // prettier-ignore
        code: `const myVar: string[] = ['hello'];`,
        // prettier-ignore
        expected: `
            const myVar: string[] = [
                'hello',
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        name: 'double element string array with type definition',
        // prettier-ignore
        code: `const myVar: string[] = ['hello', 'there'];`,
        // prettier-ignore
        expected: `
            const myVar: string[] = [
                'hello',
                'there',
            ];
        `,
    },
    {
        name: 'non-array string assignment',
        // prettier-ignore
        code: `
            const myVar:string=
            'hello';`,
        // prettier-ignore
        expected: `
            const myVar: string = 'hello';
        `,
    },
    {
        name: 'non-array single line object assignment',
        // prettier-ignore
        code: `
            const myVar: object = {a: 'here', b: 'there'};
        `,
    },
    {
        name: 'non-array multi-line object assignment',
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
        name: 'array with an earlier function definition',
        // prettier-ignore
        code: `
            function doStuff() {}

            const what = ['a', 'b'];



        `,
        // prettier-ignore
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
        // prettier-ignore
        code: `
            const what = ['a', function doStuff() {}];
        `,
        // prettier-ignore
        expected: `
            const what = [
                'a',
                function doStuff() {},
            ];
        `,
    },
    {
        name: 'original parser with single line object assignment',
        // prettier-ignore
        code: `
            const myVar: object = {a: 'where', b: 'everywhere'};
        `,
    },
    {
        name: 'original parser with multi-line object assignment',
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
    runTests('.js', javascriptTests);
});
