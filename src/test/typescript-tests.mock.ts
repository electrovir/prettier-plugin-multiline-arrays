import {capitalizeFirst} from '../augments/string.js';
import {
    nextLinePatternComment,
    nextWrapThresholdComment,
    resetComment,
    setLinePatternComment,
    setWrapThresholdComment,
} from '../options.js';
import {type MultilineArrayTest} from './run-tests.mock.js';

export const typescriptTests: MultilineArrayTest[] = [
    {
        it: 'comment at end of argument list with multiline array parser',
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
        it: 'works with greater than or less than inside of an array in typescript',
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
        it: 'works with type accessors',
        code: `
            export function doThing(
                [
                    data,
                ]: Parameters<stuff['param']>,
                thing: string,
            ) {}
        `,
    },
    {
        it: 'works even if filepath is undefined GitHub Issue #18 (thank you farmerpaul)',
        code: `
            const thingie = [
                otherThingie < 5 ? 'owl' : 'goat',
            ];
        `,
        options: {
            multilineArraysWrapThreshold: 0,
            filepath: undefined,
        },
    },
    {
        it: 'should work with multiple nested arrays',
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
        expect: `
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
        it: 'forces array wrapping if a trailing comma is used',
        code: `
            const myArray = [1, 2, 3,];
        `,
        expect: `
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
        it: 'forces array wrapping if a preceding new line is manually entered',
        code: `
            const myArray = [
                1, 2, 3];
        `,
        expect: `
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
        it: 'an array without wrapping should only take up one line',
        code: `
            // ${nextWrapThresholdComment} 8
            const flatArray = [0, 0, 0, 1, 1];
        `,
    },
    {
        it: 'wrap comment overrides trailing comma',
        code: `
            // ${nextWrapThresholdComment} 8
            const flatArray = [0, 0, 0, 1, 1,];
        `,
        expect: `
            // ${nextWrapThresholdComment} 8
            const flatArray = [0, 0, 0, 1, 1];
        `,
    },
    {
        it: 'a nested array without wrapping should only take up one line',
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
        it: 'set wrap threshold should carry through',
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
        it: 'next line comments should override set comments and trailing commas',
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
        expect: `
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
                [0, 0, 0, 1, 1],
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
        it: 'does not force array wrapping if a trailing comma is not used',
        code: `
            const myArray = [1, 2, 3];
        `,
        options: {
            multilineArraysWrapThreshold: 10,
        },
    },
    {
        it: 'works with array expansion in function parameters',
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
        it: 'works with array expansion in function parameters with multiple entries',
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
        it: 'basic wrap threshold comment',
        code: `
            // ${nextWrapThresholdComment} 3
            const thingieArray = ['hello'];
        `,
    },
    {
        it: 'still wraps really long text below the threshold',
        code: `
            // ${nextWrapThresholdComment} 3
            const thingieArray = ['HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello'];
        `,
        expect: `
            // ${nextWrapThresholdComment} 3
            const thingieArray = [
                'HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello',
            ];
        `,
    },
    {
        it: 'does not wrap really long text when the line count prevents it',
        code: `
            // ${nextLinePatternComment} 1 3
            const thingieArray = ['hello', 'hello', 'HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello', 'HelloHelloHelloHelloHelloHelloHelloHelloHelloHello'];
        `,
        expect: `
            // ${nextLinePatternComment} 1 3
            const thingieArray = [
                'hello',
                'hello', 'HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello', 'HelloHelloHelloHelloHelloHelloHelloHelloHelloHello',
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
        it: 'invalid elements per line reverts to default',
        code: `
            const thingieArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q'];
        `,
        expect: `
            const thingieArray = [
                'a',
                'b',
                'c',
                'd',
                'e',
                'f',
                'g',
                'h',
                'i',
                'j',
                'k',
                'l',
                'm',
                'n',
                'o',
                'p',
                'q',
            ];
        `,
        options: {
            multilineArraysLinePattern: '1 2 3 fff',
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
        code: `
            parentDoc[childIndex] = [
                doc.builders.hardlineWithoutBreakParent,
                doc.builders.breakParent,
            ];
        `,
    },
    {
        it: 'single line comment with just one line count',
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
        expect: `
            // ${nextLinePatternComment} 2
            const originalArray: Readonly<number[]> = [
                0, 1,
                2, 3,
                4,
            ] as const;
        `,
    },
    {
        it: 'set line pattern comment should carry through',
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
        expect: `
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
        it: 'should set array threshold for all array elements',
        code: `
            // ${setWrapThresholdComment} 8
            const thing = [
                [
                    0,
                    0,
                    0,
                    1,
                    1,
                ],
                [
                    0,
                    0,
                    1,
                    1,
                    0,
                ],
                [
                    0,
                    1,
                    1,
                    0,
                    0,
                ],
                [
                    1,
                    1,
                    0,
                    0,
                    0,
                ],
                [
                    1,
                    1,
                    0,
                    0,
                    0,
                ],
                [
                    0,
                    1,
                    1,
                    0,
                    0,
                ],
                [
                    0,
                    0,
                    1,
                    1,
                    0,
                ],
                [
                    0,
                    0,
                    0,
                    1,
                    1,
                ]
            ];
        `,
        expect: `
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
        it: 'should still properly wrap when lots of comments exist',
        code: `
            const thing = [
                // comment here
                [
                    0,
                    0,
                    0,
                    // comment here
                    1,
                    1,
                ],
                // comment here
                [
                    0,
                    0,
                    // comment here
                    1,
                    1,
                    0,
                ],
                [
                    0,
                    1,
                    1,
                    // comment here
                    0,
                    0,
                ],
                [
                    1,
                    1,
                    // comment here
                    0,
                    0,
                    0,
                ],
                [
                    1,
                    1,
                    0,
                    0,
                    0,
                ],
                [
                    0,
                    1,
                    1,
                    0,
                    0,
                ],
                [
                    0,
                    0,
                    1,
                    1,
                    0,
                    // comment here
                ],
                // comment here
                [
                    0,
                    0,
                    0,
                    1,
                    1,
                    // comment here
                ],
                // comment here
            ];
        `,
    },
    {
        it: 'should wrap array with multiline comments',
        code: `
            /*
                ANOTHER multiline comment
            */
            const bigBoi = [
                1,
                2,
                3,
                4,
                5,
                /*
                    MULTILINE COMMENT HERE
                */
                6,
                7,
                8,
                9,
                10,
                [
                    /*
                        ANOTHER multiline comment
                    */
                    101,
                    102,
                    103,
                    104,
                    /*
                        ANOTHER multiline comment
                    */
                ],
                11,
                12,
                13,
                14,
                15,
                16,
                17,
                18,
                19,
                20,
                21,
                22,
                23,
            ];
            /*
                ANOTHER multiline comment
            */
      `,
    },
    {
        it: 'line pattern comments should override options property',
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
        expect: `
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
        it: 'reset should clear set comment',
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
        expect: `
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
        it: 'single line comment with just one line wrapped',
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
        expect: `
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
        it: 'TS array with just a comment',
        code: `
            const myObject = {
                data: [
                    // comment
                ],
            };
        `,
    },
    {
        it: 'TS array with a bunch of comments',
        code: `
            const myObject = {
                data: [
                    // comment
                    // comment
                    // comment
                    // comment
                    // comment
                    // comment
                    // comment
                    // comment
                    // comment
                    // comment
                    // comment
                    // comment
                ],
            };
        `,
    },
    {
        // caused a max call stack exceeded error once
        it: 'single object element with multiline template',
        code: `




            const stuff = [


                {
                    innerStuff: \`
                        const myVar: object = {a: 'where', b: 'everywhere'};
                    \`,
                },
            ];
        `,
        expect: `
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
        it: 'long function definition with multiline array parser',
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
        it: 'comment after end of block with multiline array parser',
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
        code: `
            expect(createArrayValidator(typeofValidators.boolean)([3, 4])).toBe(false);
        `,
        expect: `
            expect(
                createArrayValidator(typeofValidators.boolean)([
                    3,
                    4,
                ]),
            ).toBe(false);
        `,
        options: {
            multilineArraysWrapThreshold: 0,
        },
    },
    {
        it: 'does not wrap an empty array if threshold is 1',
        code: `
            const thing = [];
        `,
        options: {
            multilineArraysWrapThreshold: 1,
        },
    },
    {
        it: 'handles a simple array',
        code: `
            const arr = [
                1,
                3,
            ];
        `,
    },
    {
        it: 'handles a comment being inside of an array',
        code: `
            const arr = [
                1,
                // 2,
                3,
            ];
        `,
    },
    {
        it: 'handles as const with trailing commas',
        code: `
            function derp() {
                return [
                    {
                        operation: 'update',
                        content: 'text',
                    } as const,
                ];
            }
        `,
    },
    {
        it: 'handles as const without trailing commas',
        code: `
            function derp() {
                return [
                    {
                        operation: 'update',
                        content: 'text'
                    } as const
                ];
            }
        `,
        options: {
            trailingComma: 'none',
        },
    },
    {
        it: 'handles array ending with trailing commas',
        code: `
            const derp = {
                files: [],
                references: [
                    {path: './tsconfig.app.json'},
                    {path: './tsconfig.node.json'},
                ],
            };
        `,
    },
    {
        it: 'handles array ending without trailing commas',
        code: `
            const derp = {
                files: [],
                references: [
                    {path: './tsconfig.app.json'},
                    {path: './tsconfig.node.json'}
                ]
            };
        `,
        options: {
            trailingComma: 'none',
        },
    },
    {
        it: 'formats a map correctly without commas',
        code: `
            const array = [
                1,
                otherArray.map((it) => !it)
            ];
        `,
        options: {
            trailingComma: 'none',
        },
    },
    {
        it: 'does wrap an empty array if it contains comments',
        code: `
            const thing = [
                // comment here
            ];
        `,
    },
    {
        it: 'not arrays but callbacks with multiline array parser',
        code: `
            expose({
                versions: process.versions,
                apiRequest: async (
                    details: ApiRequestDetails<ApiRequestType>,
                ): Promise<ApiFullResponse<ApiRequestType>> => {
                    async function waitForResponse(): Promise<ApiFullResponse<ApiRequestType>> {
                        return new Promise((resolve) => {
                            ipcRenderer.once(getApiResponseEventName(details.type, requestId), (
                                event,
                                data,
                            ) => {
                                resolve(data);
                            });
                        });
                    }
                },
            });
        `,
    },
    {
        it: 'config object',
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
        options: {
            multilineArraysWrapThreshold: 1,
        },
    },
    {
        it: 'nested single-line objects on multiple lines',
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
        code: `
            const nested = [{success: true, filePath: ''}, {success: false, error: 'hello there', filePath: ''}, {success: false, error: '', filePath: ''}];
        `,
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
        code: `
            const nested = [{
                success: true, filePath: ''}, {
                    success: false, error: 'hello there', filePath: ''}, {
                        success: false, error: '', filePath: ''}];
        `,
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
        expect: `
            // ${nextLinePatternComment} 2 1 3
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
        it: 'nested array',
        code: `
            const nestedArray = [
                'q', 'r',
                ['s', 't'],
            ];`,
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
        code: `
            const myVar1: string[] = [];
        `,
    },
    {
        it: 'single element array on one line',
        code: `let anotherThing: string[] = ['1 1'];`,
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
        code: `
            let anotherThing: string[] = ['1 1'
            ];`,
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
        code: `
            const myVar2: string[] = [];
            let anotherThing: string[] = ['1 1'];
            let anotherThing2: string[] = ['1 1'
            ];
            const also: string[] = [
                '2, 1',
                '2, 2',
            ];`,
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
        code: `const myVar: string[] = ['hello'];`,
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
        code: `const myVar: string[] = ['hello', 'there'];`,
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
        code: `
            const myVar:string=
            'hello';`,
        expect: `
            const myVar: string = 'hello';
        `,
    },
    {
        it: 'non-array single line object assignment',
        code: `
            const myVar: object = {a: 'here', b: 'there'};
        `,
    },
    {
        it: 'non-array multi-line object assignment',
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
        code: `
            function doStuff() {}

            const what = ['a', 'b'];



        `,
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
        code: `
            const what = ['a', function doStuff() {}];
        `,
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
        code: `
            const myVar: object = {a: 'where', b: 'everywhere'};
        `,
    },
    {
        it: 'original parser with multi-line object assignment',
        code: `
            const myVar: object = {
                a: 'where',
                b: 'everywhere',
            };
        `,
    },
];
