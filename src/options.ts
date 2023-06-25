import {getObjectTypedKeys, PropertyValueType} from '@augment-vir/common';
import {SupportOptionType as PrettierOptionType} from 'prettier';

export const envDebugKey = 'NEW_LINE_DEBUG';

export const nextLinePatternComment = 'prettier-multiline-arrays-next-line-pattern:';
// all the text up until the comment trigger
export const untilNextLinePatternCommentRegExp = new RegExp(`.*${nextLinePatternComment}`);
export const setLinePatternComment = 'prettier-multiline-arrays-set-line-pattern:';
// all the text up until the comment trigger
export const untilSetLinePatternCommentRegExp = new RegExp(`.*${setLinePatternComment}`);

export const nextWrapThresholdComment = 'prettier-multiline-arrays-next-threshold:';
// all the text up until the comment trigger
export const untilNextWrapThresholdCommentRegExp = new RegExp(`.*${nextWrapThresholdComment}`);
export const setWrapThresholdComment = 'prettier-multiline-arrays-set-threshold:';
// all the text up until the comment trigger
export const untilSetWrapThresholdCommentRegExp = new RegExp(`.*${setWrapThresholdComment}`);

export const resetComment = 'prettier-multiline-arrays-reset';

export type MultilineArrayOptions = {
    /**
     * If there are MORE elements in the array than this, the array will be forced to wrap.
     *
     * The default is 1, which indicates that all arrays with more than 1 element will wrap.
     *
     * Set to 2 to only wrap if there are more than 2 element. Etc.
     */
    multilineArraysWrapThreshold: number;
    multilineArraysLinePattern: string;
    multilineFunctionArguments: boolean;
};

export const optionHelp: Record<keyof MultilineArrayOptions, string> = {
    multilineArraysWrapThreshold: `A number indicating that all arrays should wrap when they have MORE than the specified number. Defaults to -1, indicating that no special wrapping enforcement will take place.\nExample: multilineArraysWrapThreshold: 3\nCan be overridden with a comment starting with ${nextWrapThresholdComment}.\nComment example: // ${nextWrapThresholdComment} 5`,
    multilineArraysLinePattern: `A string with a space separated list of numbers indicating how many elements should be on each line. The pattern repeats if an array is longer than the pattern. Defaults to an empty string. Any invalid numbers causes the whole pattern to revert to the default. This overrides the wrap threshold option.\nExample: elementsPerLinePattern: "3 2 1"\nCan be overridden with a comment starting with ${nextLinePatternComment}.\nComment example: // ${nextLinePatternComment} 3 2 1\nThis option overrides Prettier's default wrapping; multiple elements on one line will not be wrapped even if they don't fit within the column count.`,
    multilineFunctionArguments:
        'Applies all array wrapping logic to function argument lists as well. Experimental: does not work at all right now.',
};

export const optionPropertyValidators: {
    [Property in keyof MultilineArrayOptions]: (
        input: unknown,
    ) => input is MultilineArrayOptions[Property];
} = {
    multilineArraysWrapThreshold(input): input is number {
        return typeof input === 'number' && !isNaN(input);
    },
    multilineArraysLinePattern(input): input is string {
        if (typeof input !== 'string') {
            return false;
        }

        const splitNumbers = input.split(' ');

        return splitNumbers.every((splitNumber) => {
            const numericSplit = Number(splitNumber);
            return !isNaN(numericSplit);
        });
    },
    multilineFunctionArguments(input): input is boolean {
        return typeof input === 'boolean';
    },
};

export const defaultMultilineArrayOptions: MultilineArrayOptions = {
    multilineArraysWrapThreshold: -1,
    multilineArraysLinePattern: '',
    multilineFunctionArguments: false,
};

const optionTypeToPrettierOptionTypeMapping: Record<string, PrettierOptionType> = {
    number: 'int',
    boolean: 'boolean',
    string: 'string',
} as const satisfies Record<'boolean' | 'number' | 'string', PrettierOptionType>;

export function getPrettierOptionType(
    input: PropertyValueType<MultilineArrayOptions>,
): PrettierOptionType {
    const mappedType = optionTypeToPrettierOptionTypeMapping[typeof input];

    if (mappedType) {
        return mappedType;
    } else {
        throw new Error(`Unmapped option type: '${typeof input}'`);
    }
}

export function fillInOptions<T extends object>(input: T | undefined): MultilineArrayOptions & T {
    if (!input || typeof input !== 'object') {
        return defaultMultilineArrayOptions as MultilineArrayOptions & T;
    }
    const newOptions: MultilineArrayOptions & T = {
        ...input,
    } as MultilineArrayOptions & T;
    getObjectTypedKeys(defaultMultilineArrayOptions).forEach((optionsKey) => {
        const inputValue: unknown = (input as any)[optionsKey];
        const defaultValue = defaultMultilineArrayOptions[optionsKey];
        if (optionPropertyValidators[optionsKey](inputValue)) {
            (newOptions as Record<typeof optionsKey, typeof inputValue>)[optionsKey] = inputValue;
        } else {
            (newOptions as Record<typeof optionsKey, typeof defaultValue>)[optionsKey] =
                defaultValue;
        }
    });

    return newOptions;
}
