import {format as prettierFormat, Options} from 'prettier';
// ignore this import cause it's not typed. We're typing it here!
// @ts-expect-error
import * as importedRepoConfig from '../../.prettierrc.js';
import {MultilineArrayOptions} from '../options';

const repoConfig: Options = importedRepoConfig as Options;

function format(
    code: string,
    extension: string,
    options: Partial<MultilineArrayOptions> = {},
    parser: string | undefined,
): string {
    if (extension.startsWith('.')) {
        extension = extension.slice(1);
    }

    const plugins = repoConfig.plugins?.map((entry) => {
        if (entry === './dist/') {
            return '.';
        } else {
            return entry;
        }
    }) ?? [
        '.',
    ];

    return prettierFormat(code, {
        ...repoConfig,
        ...options,
        ...(parser ? {parser} : {}),
        filepath: `blah.${extension}`,
        plugins,
    });
}

export type MultilineArrayTest = {
    name: string;
    code: string;
    expected?: string | undefined;
    options?: Partial<MultilineArrayOptions> | undefined;
    force?: true;
    failureMessage?: string;
};

let forced = false;

let allPassed = true;

function removeIndent(input: string): string {
    return input
        .replace(/^\s*\n\s*/, '')
        .replace(/\n {12}/g, '\n')
        .replace(/\n\s+$/, '\n');
}

export function runTests(extension: string, tests: MultilineArrayTest[], parser?: string) {
    tests.forEach((test) => {
        const testCallback = () => {
            try {
                const inputCode = removeIndent(test.code);
                const expected = removeIndent(test.expected ?? test.code);
                const formatted = format(inputCode, extension, test.options, parser);
                expect(formatted).toBe(expected);
                if (formatted !== expected) {
                    allPassed = false;
                }
            } catch (error) {
                allPassed = false;
                if (test.failureMessage && error instanceof Error) {
                    if (test.failureMessage !== error.message) {
                        console.info({message: error.message});
                    }
                    expect(error.message).toBe(test.failureMessage);
                } else {
                    throw error;
                }
            }
        };

        if (test.force) {
            forced = true;
            fit(test.name, testCallback);
        } else {
            it(test.name, testCallback);
        }
    });

    if (forced) {
        fit('forced tests should not remain in the code', () => {
            if (allPassed) {
                expect(forced).toBe(false);
            }
        });
    }
}
