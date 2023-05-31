import {PartialAndNullable} from '@augment-vir/common';
import {assert} from 'chai';
import {it} from 'mocha';
import {format as prettierFormat, Options as PrettierOptions} from 'prettier';
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
    }) ?? ['.'];

    return prettierFormat(code, {
        filepath: `blah.${extension}`,
        ...repoConfig,
        ...options,
        ...(parser ? {parser} : {}),
        plugins,
    });
}

export type MultilineArrayTest = {
    name: string;
    code: string;
    expected?: string | undefined;
    options?: (Partial<MultilineArrayOptions> & PartialAndNullable<PrettierOptions>) | undefined;
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
        function testCallback() {
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
        }

        if (test.force) {
            forced = true;
            it.only(test.name, () => {
                testCallback();
            });
        } else if (test.exclude) {
            it.skip(test.name, testCallback);
        } else {
            it(test.name, testCallback);
        }
    });

    if (forced) {
        it.only('forced tests should not remain in the code', () => {
            if (allPassed) {
                assert.strictEqual(forced, false);
            }
        });
    }
}
