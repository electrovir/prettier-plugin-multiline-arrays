import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {format, type Options} from 'prettier';
import {nextLinePatternComment, nextWrapThresholdComment} from '../options.js';
import {repoConfig} from './prettier-config.js';
import {type MultilineArrayTest, runTests} from './run-tests.mock.js';

const oxcPlugins = [
    '@prettier/plugin-oxc',
    ...(repoConfig.plugins ?? []),
] as NonNullable<Options['plugins']>;
const pluginsWithSortImports = [
    '@ianvs/prettier-plugin-sort-imports',
    ...(repoConfig.plugins ?? []),
] as NonNullable<Options['plugins']>;
const oxcPluginsWithSortImports = [
    '@prettier/plugin-oxc',
    '@ianvs/prettier-plugin-sort-imports',
    ...(repoConfig.plugins ?? []),
] as NonNullable<Options['plugins']>;

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
                // ${nextWrapThresholdComment} 4
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
    it: 'formats TypeScript call arguments with ordinary oxc line comments',
    code: `
            const result = call(
                // hello
                [1, 2, 3, 4],
            );
    `,
    options: {
        plugins: oxcPlugins,
    },
};

const oxcJsOrdinaryCommentInCallArgumentsTest: MultilineArrayTest = {
    ...oxcTsOrdinaryCommentInCallArgumentsTest,
    it: 'formats JavaScript call arguments with ordinary oxc line comments',
};

const oxcTsDanglingTriggerCommentInCallArgumentsTest: MultilineArrayTest = {
    it: 'preserves TypeScript oxc trigger comments that do not apply to an array',
    code: `
            const result = call(
                // ${nextWrapThresholdComment} 4
                value,
            );
    `,
    options: {
        plugins: oxcPlugins,
    },
};

const oxcJsDanglingTriggerCommentInCallArgumentsTest: MultilineArrayTest = {
    ...oxcTsDanglingTriggerCommentInCallArgumentsTest,
    it: 'preserves JavaScript oxc trigger comments that do not apply to an array',
};

const oxcTsTriggerCommentBeforeDeclarationTest: MultilineArrayTest = {
    it: 'formats TypeScript arrays with oxc trigger comments before declarations',
    code: `
            // ${nextWrapThresholdComment} 0
            const values = ['hello'];
    `,
    expect: `
            // ${nextWrapThresholdComment} 0
            const values = [
                'hello',
            ];
    `,
    options: {
        plugins: oxcPlugins,
    },
};

const oxcTsTriggerCommentInTemplateExpressionTest: MultilineArrayTest = {
    it: 'formats TypeScript arrays with oxc trigger comments in template expressions',
    code: `
            const text = \`\${call(
                // ${nextWrapThresholdComment} 0
                [1],
            )}\`;
    `,
    expect: `
            const text = \`\${call(
                // ${nextWrapThresholdComment} 0
                [
                    1,
                ],
            )}\`;
    `,
    options: {
        plugins: oxcPlugins,
    },
};

const oxcJsTriggerCommentInTemplateExpressionTest: MultilineArrayTest = {
    ...oxcTsTriggerCommentInTemplateExpressionTest,
    it: 'formats JavaScript arrays with oxc trigger comments in template expressions',
};

const oxcTsTriggerTextInRegexLiteralTest: MultilineArrayTest = {
    it: 'ignores TypeScript oxc trigger text inside regex literals',
    code: `
            const matcher = /${nextWrapThresholdComment} 0/;
            const values = [1];
    `,
    options: {
        plugins: oxcPlugins,
    },
};

const oxcJsTriggerTextInRegexLiteralTest: MultilineArrayTest = {
    ...oxcTsTriggerTextInRegexLiteralTest,
    it: 'ignores JavaScript oxc trigger text inside regex literals',
};

const oxcTsTriggerTextInTemplateRawTest: MultilineArrayTest = {
    it: 'ignores TypeScript oxc trigger text inside template raw text',
    code: `
            const message = \`// ${nextWrapThresholdComment} 0\`;
            const values = [1];
    `,
    options: {
        plugins: oxcPlugins,
    },
};

const oxcJsTriggerTextInTemplateRawTest: MultilineArrayTest = {
    ...oxcTsTriggerTextInTemplateRawTest,
    it: 'ignores JavaScript oxc trigger text inside template raw text',
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
                // ${nextLinePatternComment} 4
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
                // ${nextLinePatternComment} 4
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

const cacheIsolationCode = `import {z} from './z';
import {pkg} from 'pkg';
const result = call(
    // ${nextWrapThresholdComment} 0
    [1],
);
`;

const cacheIsolationExpected = `import {z} from './z';
import {pkg} from 'pkg';
const result = call(
    // ${nextWrapThresholdComment} 0
    [
        1,
    ],
);
`;

describe('oxc multiline array formatting', () => {
    runTests(
        '.ts',
        [
            oxcTsTest,
            oxcTsTriggerCommentInCallArgumentsTest,
            oxcTsOrdinaryCommentInCallArgumentsTest,
            oxcTsDanglingTriggerCommentInCallArgumentsTest,
            oxcTsTriggerCommentBeforeDeclarationTest,
            oxcTsTriggerCommentInTemplateExpressionTest,
            oxcTsTriggerTextInRegexLiteralTest,
            oxcTsTriggerTextInTemplateRawTest,
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
            oxcJsDanglingTriggerCommentInCallArgumentsTest,
            oxcJsTriggerCommentInTemplateExpressionTest,
            oxcJsTriggerTextInRegexLiteralTest,
            oxcJsTriggerTextInTemplateRawTest,
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

    it('does not reuse oxc preprocessed trigger lines in later TypeScript formats', async () => {
        const typescriptOptions: Options = {
            ...repoConfig,
            parser: 'typescript',
        };

        const formattedBefore = await format(cacheIsolationCode, typescriptOptions);
        await format(cacheIsolationCode, {
            ...repoConfig,
            parser: 'oxc-ts',
            plugins: oxcPluginsWithSortImports,
        });
        const formattedAfter = await format(cacheIsolationCode, typescriptOptions);

        assert.strictEquals(formattedBefore, cacheIsolationExpected);
        assert.strictEquals(formattedAfter, formattedBefore);
    });
});
