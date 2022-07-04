import {getObjectTypedKeys} from 'augment-vir';

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
    multilineArraysWrapThreshold: `A number indicating that all arrays should wrap when they have MORE than the specified number. Defaults to 1, indicating that all arrays with more than one element will wrap.\nExample: multilineArraysWrapThreshold: 3\nCan be overridden with a comment starting with ${nextWrapThresholdComment}.\nComment example: // ${nextWrapThresholdComment} 5`,
    multilineArraysLinePattern: `A string with a space separated list of numbers indicating how many elements should be on each line. The pattern repeats if an array is longer than the pattern. Defaults to an empty string. Any invalid numbers causes the whole pattern to revert to the default. This overrides the wrap threshold option.\nExample: elementsPerLinePattern: "3 2 1"\nCan be overridden with a comment starting with ${nextLinePatternComment}.\nComment example: // ${nextLinePatternComment} 3 2 1\nThis option overrides Prettier's default wrapping; multiple elements on one line will not be wrapped even if they don't fit within the column count.`,
    multilineFunctionArguments:
        'Applies all array wrapping logic to function argument lists as well.',
};

const optionPropertyValidators: {
    [Property in keyof MultilineArrayOptions]: (
        input: any,
    ) => input is MultilineArrayOptions[Property];
} = {
    multilineArraysWrapThreshold: (input): input is number =>
        typeof input === 'number' && !isNaN(input),
    multilineArraysLinePattern: (input): input is string => typeof input === 'string',
    multilineFunctionArguments: (input): input is boolean => typeof input === 'boolean',
};

export const defaultMultilineArrayOptions: MultilineArrayOptions = {
    multilineArraysWrapThreshold: 1,
    multilineArraysLinePattern: '',
    multilineFunctionArguments: false,
};

export function fillInOptions<T extends object>(input: T | undefined): MultilineArrayOptions & T {
    if (!input || typeof input !== 'object') {
        return defaultMultilineArrayOptions as MultilineArrayOptions & T;
    }
    const newOptions: MultilineArrayOptions & T = {...input} as MultilineArrayOptions & T;
    getObjectTypedKeys(defaultMultilineArrayOptions).forEach((optionsKey) => {
        const inputValue: unknown = (input as any)[optionsKey];
        const defaultValue = defaultMultilineArrayOptions[optionsKey];
        if (!optionPropertyValidators[optionsKey](inputValue)) {
            if (inputValue != undefined) {
                // only log the error when the key is actually provided
                console.error(
                    `Invalid type for Prettier options key ${optionsKey}. Expected ${typeof defaultValue} but got ${typeof inputValue}.`,
                );
            }
            (newOptions as Record<typeof optionsKey, typeof defaultValue>)[optionsKey] =
                defaultValue;
        } else {
            (newOptions as Record<typeof optionsKey, typeof inputValue>)[optionsKey] = inputValue;
        }
    });

    return newOptions;
}
