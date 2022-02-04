import {BuiltInParserName, format as prettierFormat, LiteralUnion} from 'prettier';
import {lineContainsTriggerComment, parserName} from './metadata/package-phrases';
import {repoConfig} from './metadata/prettier-config-for-tests';

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
        name: 'comment at end of argument list with newline parser',
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
        name: 'comment at end of argument list with normal parser',
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
        parser: 'typescript',
    },
    {
        name: 'long function definition with newline parser',
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
        name: 'long function definition with normal parser',
        code: `
            export async function selectFiles(
                inputProperties: OpenDialogProperty[] = [
                    OpenDialogProperty.multiSelections,
                    OpenDialogProperty.openFile,
                    OpenDialogProperty.openDirectory,
                ],
            ): Promise<undefined | string[]> {}
        `,
        parser: 'typescript',
    },
    {
        name: 'comment after end of block with newline parser',
        code: `
            if (thing) {
            }
            // otherwise we are editing currently existing songs
            else {
            }
        `,
    },
    {
        name: 'comment after end of block with normal parser',
        code: `
            if (thing) {
            }
            // otherwise we are editing currently existing songs
            else {
            }
        `,
        parser: 'typescript',
    },
    {
        name: 'deep array call should include trailing comma still',
        code: `
            expect(createArrayValidator(typeofValidators.boolean)([3, 4])).toBe(false);
        `,
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
        name: 'not arrays but callbacks with newline parser',
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
        name: 'not arrays but callbacks with normal parser',
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
        parser: 'typescript',
    },
    {
        name: 'function parameters',
        code: `
            doTheThing('a', 'b', 'c');
        `,
    },
    {
        name: 'config object',
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
        code: `
            const nested = [{success: true, filePath: ''}, {success: false, error: 'hello there', filePath: ''}, {success: false, error: '', filePath: ''}];
        `,
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
        code: `
            const nested = [{
                success: true, filePath: ''}, {
                    success: false, error: 'hello there', filePath: ''}, {
                        success: false, error: '', filePath: ''}];
        `,
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
    return input
        .replace(/^\s*\n\s*/, '')
        .replace(/\n {12}/g, '\n')
        .replace(/\n\s+$/, '\n');
}

describe('plugin formatting', () => {
    tests.forEach((test) => {
        const testCallback = () => {
            const inputCode = removeIndent(test.code);
            const expected = removeIndent(test.expected ?? test.code);
            const formatted = format(inputCode, test.parser);
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
