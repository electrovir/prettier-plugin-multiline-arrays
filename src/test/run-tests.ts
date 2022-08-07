import {assert} from 'chai';
import {it} from 'mocha';
import {format as prettierFormat} from 'prettier';
import {stripColor} from '../augments/string';
import {MultilineArrayOptions} from '../options';
import {repoConfig} from './prettier-config';

function runPrettierFormat(
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
    exclude?: true;
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
                const formatted = runPrettierFormat(inputCode, extension, test.options, parser);
                assert.strictEqual(formatted, expected);
                if (formatted !== expected) {
                    allPassed = false;
                }
            } catch (error) {
                allPassed = false;
                if (test.failureMessage && error instanceof Error) {
                    const strippedMessage = stripColor(error.message);
                    if (test.failureMessage !== strippedMessage) {
                        console.info({strippedMessage});
                    }
                    assert.strictEqual(stripColor(strippedMessage), test.failureMessage);
                } else {
                    throw error;
                }
            }
        };

        if (test.force) {
            forced = true;
            fit(test.name, testCallback);
        } else if (test.exclude) {
            xit(test.name, testCallback);
        } else {
            it(test.name, testCallback);
        }
    });

    if (forced) {
        fit('forced tests should not remain in the code', () => {
            if (allPassed) {
                assert.strictEqual(forced, false);
            }
        });
    }
}
