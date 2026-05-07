import {describe} from '@augment-vir/test';
import {type Options} from 'prettier';
import {nextLinePatternComment, nextWrapThresholdComment} from '../options.js';
import {repoConfig} from './prettier-config.js';
import {type MultilineArrayTest, runTests} from './run-tests.mock.js';

const oxcPlugins = [
    '@prettier/plugin-oxc',
    ...(repoConfig.plugins ?? []),
] as Options['plugins'];
const pluginsWithSortImports = [
    '@ianvs/prettier-plugin-sort-imports',
    ...(repoConfig.plugins ?? []),
] as Options['plugins'];
const oxcPluginsWithSortImports = [
    '@prettier/plugin-oxc',
    '@ianvs/prettier-plugin-sort-imports',
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

const sortImportsLinePatternCode = `
            import {localSecond} from './local-second';
            import {packageValue} from 'package';
            import {second} from './second';
            import {first} from './first';

            const result = call(
                // ${nextLinePatternComment} 4
                [255, 0, 255, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 0, 255, 255],
            );
`;

const sortImportsLinePatternOxcExpect = `
            import {packageValue} from 'package';

            import {first} from './first';
            import {localSecond} from './local-second';
            import {second} from './second';

            const result = call(
                
                [
                    255, 0, 255, 255,
                    0, 0, 0, 255,
                    0, 0, 0, 255,
                    255, 0, 255, 255,
                ],
            );
`;

const sortImportsLinePatternStandardExpect = `
            import {packageValue} from 'package';

            import {first} from './first';
            import {localSecond} from './local-second';
            import {second} from './second';

            const result = call(
                // ${nextLinePatternComment} 4
                [
                    255, 0, 255, 255,
                    0, 0, 0, 255,
                    0, 0, 0, 255,
                    255, 0, 255, 255,
                ],
            );
`;

const oxcTsLinePatternWithSortImportsTest: MultilineArrayTest = {
    it: 'formats TypeScript line pattern comments with oxc and sort imports',
    code: sortImportsLinePatternCode,
    expect: sortImportsLinePatternOxcExpect,
    options: {
        plugins: oxcPluginsWithSortImports,
    },
};

const oxcTsLinePatternWithoutSortImportsTest: MultilineArrayTest = {
    it: 'formats TypeScript line pattern comments with oxc without sort imports',
    code: sortImportsLinePatternCode,
    expect: `
            import {localSecond} from './local-second';
            import {packageValue} from 'package';
            import {second} from './second';
            import {first} from './first';

            const result = call(
                
                [
                    255, 0, 255, 255,
                    0, 0, 0, 255,
                    0, 0, 0, 255,
                    255, 0, 255, 255,
                ],
            );
    `,
    options: {
        plugins: oxcPlugins,
    },
};

const typescriptLinePatternWithSortImportsTest: MultilineArrayTest = {
    it: 'formats TypeScript line pattern comments with the TypeScript parser and sort imports',
    code: sortImportsLinePatternCode,
    expect: sortImportsLinePatternStandardExpect,
    options: {
        plugins: pluginsWithSortImports,
    },
};

describe('oxc multiline array formatting', () => {
    runTests(
        '.ts',
        [
            oxcTsTest,
            oxcTsTriggerCommentInCallArgumentsTest,
            oxcTsOrdinaryCommentInCallArgumentsTest,
            oxcTsLinePatternWithoutSortImportsTest,
            oxcTsLinePatternWithSortImportsTest,
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
    runTests(
        '.ts',
        [
            typescriptLinePatternWithSortImportsTest,
        ],
        'typescript',
    );
});
