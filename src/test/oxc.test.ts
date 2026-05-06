import {describe} from '@augment-vir/test';
import {type Options} from 'prettier';
import {nextWrapThresholdComment} from '../options.js';
import {repoConfig} from './prettier-config.js';
import {type MultilineArrayTest, runTests} from './run-tests.mock.js';

const oxcPlugins = [
    '@prettier/plugin-oxc',
    ...(repoConfig.plugins ?? []),
] as Options['plugins'];

const oxcTsTest: MultilineArrayTest = {
    it: 'formats TypeScript arrays with the oxc parser',
    code: `
            const values = [1, 2];
    `,
    expect: `
            const values = [
                1,
                2,
            ];
    `,
    options: {
        multilineArraysWrapThreshold: 1,
        plugins: oxcPlugins,
    },
};

const oxcJsTest: MultilineArrayTest = {
    it: 'formats JavaScript arrays with the oxc parser',
    code: `
            const values = [1, 2];
    `,
    expect: `
            const values = [
                1,
                2,
            ];
    `,
    options: {
        multilineArraysWrapThreshold: 1,
        plugins: oxcPlugins,
    },
};

const oxcTsTriggerCommentInCallArgumentsTest: MultilineArrayTest = {
    it: 'formats TypeScript call arguments with oxc trigger comments',
    code: `
            const result = call(
                // ${nextWrapThresholdComment} 4
                [1, 2, 3, 4, 5],
            );
    `,
    expect: `
            const result = call(
                
                [
                    1,
                    2,
                    3,
                    4,
                    5,
                ],
            );
    `,
    options: {
        plugins: oxcPlugins,
    },
};

const oxcJsTriggerCommentInCallArgumentsTest: MultilineArrayTest = {
    ...oxcTsTriggerCommentInCallArgumentsTest,
    it: 'formats JavaScript call arguments with oxc trigger comments',
};

const oxcTsOrdinaryCommentInCallArgumentsTest: MultilineArrayTest = {
    it: 'formats TypeScript call arguments with ordinary oxc line comments once upstream supports them',
    code: `
            const result = call(
                // hello
                [1, 2, 3, 4],
            );
    `,
    options: {
        plugins: oxcPlugins,
    },
    /**
     * The plugin-owned trigger-comment workaround intentionally does not hide ordinary comments.
     * Keep this skipped test as a reminder to re-check the upstream oxc comment-attachment crash.
     */
    skip: true,
};

const oxcJsOrdinaryCommentInCallArgumentsTest: MultilineArrayTest = {
    ...oxcTsOrdinaryCommentInCallArgumentsTest,
    it: 'formats JavaScript call arguments with ordinary oxc line comments once upstream supports them',
};

describe('oxc multiline array formatting', () => {
    runTests(
        '.ts',
        [
            oxcTsTest,
            oxcTsTriggerCommentInCallArgumentsTest,
            oxcTsOrdinaryCommentInCallArgumentsTest,
        ],
        'oxc-ts',
    );
    runTests(
        '.js',
        [
            oxcJsTest,
            oxcJsTriggerCommentInCallArgumentsTest,
            oxcJsOrdinaryCommentInCallArgumentsTest,
        ],
        'oxc',
    );
});
