import {capitalizeFirst} from '../augments/string';
import {
    nextLinePatternComment,
    nextWrapThresholdComment,
    resetComment,
    setLinePatternComment,
    setWrapThresholdComment,
} from '../options';
import {MultilineArrayTest} from './run-tests';

export const typescriptTests: MultilineArrayTest[] = [
    {
        name: 'comment at end of argument list with multiline array parser',
        // prettier-ignore
        code: `
            export function hasProperty<ObjectGeneric extends object, KeyGeneric extends PropertyKey>(
                inputObject: ObjectGeneric,
                inputKey: KeyGeneric,
                // @ts-ignore this type signature is actually exactly what I want
            ): inputObject is ObjectGeneric extends Record<KeyGeneric, any>
                ? Extract<ObjectGeneric, {[SubProperty in KeyGeneric]: unknown}>
                : Record<KeyGeneric, unknown> {
                return inputKey in inputObject;
            }
        `,
    },
    {
        name: 'works with greater than or less than inside of an array in typescript',
        code: `
            const thingie = [
                otherThingie < 5 ? 'owl' : 'goat',
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        name: 'should not wrap a function call with just one argument',
        code: `
            doThing('what');
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        name: 'should not wrap inner objects',
        code: `
            console.info({stdout: output.results.stdout});
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        name: 'should wrap a function call with just two arguments',
        code: `
            doThing('what', 'who');
        `,
        expected: `
            doThing(
                'what',
                'who',
            );
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        name: 'should not wrap a function definition with just one argument',
        code: `
            function mapToActualPaths(
                paths: Readonly<string[]>,
            ): Readonly<string[]> {}
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        name: 'works with a whole file of code that was failing',
        code: `
            import {assert} from 'chai';
            import {basename} from 'path';
            
            describe(basename(__filename), () => {
                it('should have a valid test', () => {
                    assert.isTrue(true);
                });
            });
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        name: 'should work with multiple nested arrays',
        code: `
            const thingie = [
                [
                    1,
                    2,
                    3,
                ],
                [
                    4,
                    5,
                    6,
                    0,
                ],
                [
                    7,
                    8,
                    9,
                ],
                [10],
            ];
        `,
        expected: `
            const thingie = [
                [
                    1,
                    2,
                    3,
                ],
                [
                    4,
                    5,
                    6,
                    0,
                ],
                [
                    7,
                    8,
                    9,
                ],
                [
                    10,
                ],
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        name: 'forces array wrapping if a trailing comma is used',
        code: `
            const myArray = [1, 2, 3,];
        `,
        expected: `
            const myArray = [
                1,
                2,
                3,
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 10,
        },
    },
    {
        name: 'an array without wrapping should only take up one line',
        code: `
            // ${nextWrapThresholdComment} 8
            const flatArray = [0, 0, 0, 1, 1];
        `,
    },
    {
        name: 'a nested array without wrapping should only take up one line',
        code: `
            const flatNestedArray = [
                // ${nextWrapThresholdComment} 8
                [0, 0, 0, 1, 1],
                // ${nextWrapThresholdComment} 8
                [0, 0, 0, 1, 1],
                // ${nextWrapThresholdComment} 8
                [0, 0, 0, 1, 1],
                // ${nextWrapThresholdComment} 8
                [0, 0, 0, 1, 1],
                // ${nextWrapThresholdComment} 8
                [0, 0, 0, 1, 1],
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        name: 'set wrap threshold should carry through',
        code: `
            const flatNestedArray = [
                // ${setWrapThresholdComment} 8
                [0, 0, 0, 1, 1],
                [0, 0, 0, 1, 1],
                [0, 0, 0, 1, 1],
                [0, 0, 0, 1, 1],
                [0, 0, 0, 1, 1],
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        name: 'next line comments should override set comments and trailing commas should still work',
        code: `
            const flatNestedArray = [
                // ${setWrapThresholdComment} 8
                [0, 0, 0, 1, 1],
                [0, 0, 0, 1, 1],
                // ${nextWrapThresholdComment} 2
                [
                    0,
                    0,
                    0,
                    1,
                    1,
                ],
                // has trailing comma
                [0, 0, 0, 1, 1,],
                [0, 0, 0, 1, 1],
                [0, 0, 0, 1, 1, 0, 1, 1, 1],
            ];
        `,
        expected: `
            const flatNestedArray = [
                // ${setWrapThresholdComment} 8
                [0, 0, 0, 1, 1],
                [0, 0, 0, 1, 1],
                // ${nextWrapThresholdComment} 2
                [
                    0,
                    0,
                    0,
                    1,
                    1,
                ],
                // has trailing comma
                [
                    0,
                    0,
                    0,
                    1,
                    1,
                ],
                [0, 0, 0, 1, 1],
                [
                    0,
                    0,
                    0,
                    1,
                    1,
                    0,
                    1,
                    1,
                    1,
                ],
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        name: 'does not force array wrapping if a trailing comma is not used',
        code: `
            const myArray = [1, 2, 3];
        `,
        options: {
            multilineArraysWrapThreshold: 10,
        },
    },
    {
        name: 'works with array expansion in function parameters',
        code: `
            export function update(
                partInfo: PartInfo,
                [
                    callback,
                ]: [
                    OnOsThemeChangeCallback,
                ],
            ) {}
        `,
        options: {
            multilineArraysWrapThreshold: 10,
        },
    },
    {
        name: 'works with array expansion in function parameters with multiple entries',
        code: `
            export function update(
                partInfo: PartInfo,
                [
                    callback,
                    otherThing,
                ]: [
                    OnOsThemeChangeCallback,
                    OtherThingHereToo,
                ],
            ) {}
        `,
    },
    {
        name: 'basic wrap threshold comment',
        code: `
            // ${nextWrapThresholdComment} 3
            const thingieArray = ['hello'];
        `,
    },
    {
        name: 'still wraps really long text below the threshold',
        code: `
            // ${nextWrapThresholdComment} 3
            const thingieArray = ['HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello'];
        `,
        expected: `
            // ${nextWrapThresholdComment} 3
            const thingieArray = [
                'HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello',
            ];
        `,
    },
    {
        name: 'does not wrap really long text when the line count prevents it',
        code: `
            // ${nextLinePatternComment} 1 3
            const thingieArray = ['hello', 'hello', 'HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello', 'HelloHelloHelloHelloHelloHelloHelloHelloHelloHello'];
        `,
        expected: `
            // ${nextLinePatternComment} 1 3
            const thingieArray = [
                'hello',
                'hello', 'HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello', 'HelloHelloHelloHelloHelloHelloHelloHelloHelloHello',
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
        name: 'invalid elements per line reverts to default',
        code: `
            const thingieArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        `,
        expected: `
            const thingieArray = [
                'a',
                'b',
                'c',
                'd',
                'e',
                'f',
                'g',
                'h',
            ];
        `,
        options: {
            multilineArraysLinePattern: '1 2 3 fff',
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
            const originalArray: Readonly<number[]> = [
                0,
                1,
                2,
                3,
                4,
            ] as const;
        `,
        expected: `
            // ${nextLinePatternComment} 2
            const originalArray: Readonly<number[]> = [
                0, 1,
                2, 3,
                4,
            ] as const;
        `,
    },
    {
        name: 'set line pattern comment should carry through',
        // prettier-ignore
        code: `
            // ${setLinePatternComment} 2
            const originalArray: Readonly<number[]> = [
                0,
                1,
                2,
                3,
                4,
            ] as const;
            const originalArray2: Readonly<number[]> = [
                0,
                1,
                2,
                3,
                4,
            ] as const;
        `,
        expected: `
            // ${setLinePatternComment} 2
            const originalArray: Readonly<number[]> = [
                0, 1,
                2, 3,
                4,
            ] as const;
            const originalArray2: Readonly<number[]> = [
                0, 1,
                2, 3,
                4,
            ] as const;
        `,
    },
    {
        name: 'should set array threshold for all array elements',
        code: `
            // ${setWrapThresholdComment} 8
            const thing = [
                [
                    0,
                    0,
                    0,
                    1,
                    1
                ],
                [
                    0,
                    0,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    0,
                    0
                ],
                [
                    1,
                    1,
                    0,
                    0,
                    0
                ],
                [
                    1,
                    1,
                    0,
                    0,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    0,
                    0
                ],
                [
                    0,
                    0,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    0,
                    0,
                    1,
                    1
                ]
            ];
        `,
        expected: `
            // ${setWrapThresholdComment} 8
            const thing = [
                [0, 0, 0, 1, 1],
                [0, 0, 1, 1, 0],
                [0, 1, 1, 0, 0],
                [1, 1, 0, 0, 0],
                [1, 1, 0, 0, 0],
                [0, 1, 1, 0, 0],
                [0, 0, 1, 1, 0],
                [0, 0, 0, 1, 1],
            ];
        `,
    },
    {
        name: 'line pattern comments should override options property',
        code: `
            const pl = [
                'prettier-plugin-sort-json', 'prettier-plugin-packagejson',
                'prettier-plugin-multiline-arrays', 'prettier-plugin-organize-imports', 'prettier-plugin-jsdoc',
            ];
          
            // ${nextLinePatternComment} 2 1
            const availableTags = [
                'a', 'aside', 'b', 'blockquote', 'br', 'code', 'em', 'figcaption', 'figure', 'h3', 'h4', 'hr', 'i', 'iframe', 'img', 'li', 'ol', 'p', 'pre', 's', 'strong', 'u', 'ul', 'video',
                'table'
            ]
        `,
        expected: `
            const pl = [
                'prettier-plugin-sort-json', 'prettier-plugin-packagejson', 'prettier-plugin-multiline-arrays',
                'prettier-plugin-organize-imports', 'prettier-plugin-jsdoc',
            ];
            
            // ${nextLinePatternComment} 2 1
            const availableTags = [
                'a', 'aside',
                'b',
                'blockquote', 'br',
                'code',
                'em', 'figcaption',
                'figure',
                'h3', 'h4',
                'hr',
                'i', 'iframe',
                'img',
                'li', 'ol',
                'p',
                'pre', 's',
                'strong',
                'u', 'ul',
                'video',
                'table',
            ];
        `,
        options: {
            multilineArraysLinePattern: '3',
        },
    },
    {
        name: 'reset should clear set comment',
        // prettier-ignore
        code: `
            // ${setLinePatternComment} 2
            const originalArray: Readonly<number[]> = [
                0,
                1,
                2,
                3,
                4,
            ] as const;
            // ${resetComment}
            const originalArray2: Readonly<number[]> = [
                0,
                1,
                2,
                3,
                4,
            ] as const;
        `,
        expected: `
            // ${setLinePatternComment} 2
            const originalArray: Readonly<number[]> = [
                0, 1,
                2, 3,
                4,
            ] as const;
            // ${resetComment}
            const originalArray2: Readonly<number[]> = [
                0,
                1,
                2,
                3,
                4,
            ] as const;
        `,
    },
    {
        name: 'single line comment with just one line wrapped',
        // prettier-ignore
        code: `
            describe(filterMap.name, () => {
                // ${nextLinePatternComment} 2
                const originalArray: Readonly<number[]> = [
                    0,
                    1,
                    2,
                    3,
                    4,
                ] as const;
            });
        `,
        expected: `
            describe(filterMap.name, () => {
                // ${nextLinePatternComment} 2
                const originalArray: Readonly<number[]> = [
                    0, 1,
                    2, 3,
                    4,
                ] as const;
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
                        const myVar: object = {a: 'where', b: 'everywhere'};
                    \`,
                },
            ];
        `,
        // prettier-ignore
        expected: `
            const stuff = [
                {
                    innerStuff: \`
                        const myVar: object = {a: 'where', b: 'everywhere'};
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
                inputProperties: OpenDialogProperty[] = [
                    OpenDialogProperty.multiSelections,
                    OpenDialogProperty.openFile,
                    OpenDialogProperty.openDirectory,
                ],
            ): Promise<undefined | string[]> {}
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
                versions: process.versions,
                apiRequest: async (
                    details: ApiRequestDetails<ApiRequestType>,
                ): Promise<ApiFullResponse<ApiRequestType>> => {
                    async function waitForResponse(): Promise<ApiFullResponse<ApiRequestType>> {
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
        name: 'arguments in function call',
        code: `
            doTheThing('a', 'b', 'c');
        `,
        expected: `
            doTheThing(
                'a',
                'b',
                'c',
            );
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        name: 'single arg arrow function',
        code: `
            const stuff = process.argv.some((arg) => arg.match(/\.tsx?$/));
        `,
        expected: `
            const stuff = process.argv.some((arg) => arg.match(/\.tsx?$/));
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    // {
    //     name: 'multi arg arrow function',
    //     code: `
    //         const stuff = process.argv.some((arg: something, index: anotherThing) => arg.match(/\.tsx?$/));
    //     `,
    //     expected: `
    //         const stuff = process.argv.some(
    //             (
    //                 arg: something,
    //                 index: anotherThing,
    //             ) => arg.match(/\.tsx?$/)
    //         );
    //     `,
    //     options: {
    //         multilineFunctionArguments: true,
    //     },
    // },
    {
        name: 'arguments in new constructor call',
        code: `
            new doTheThing('a', 'b', 'c');
        `,
        expected: `
            new doTheThing(
                'a',
                'b',
                'c',
            );
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        name: 'arguments in function definition',
        code: `
            function doTheThing(a: string, b: string, c: string) {};
        `,
        expected: `
            function doTheThing(
                a: string,
                b: string,
                c: string,
            ) {}
        `,
        options: {
            multilineFunctionArguments: true,
        },
    },
    {
        name: 'arguments in function definition no wrap when below threshold',
        code: `
            function doTheThing(a: string, b: string, c: string) {};
        `,
        expected: `
            function doTheThing(a: string, b: string, c: string) {}
        `,
        options: {
            multilineFunctionArguments: true,
            multilineArraysWrapThreshold: 10,
        },
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
