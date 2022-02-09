import {getObjectTypedKeys} from 'augment-vir/dist/web-index';

export const elementsPerLineTrigger = 'prettier-elements-per-line:';
export const untilLineTriggerRegExp = new RegExp(`.*${elementsPerLineTrigger}`);

export const elementWrapThreshold = 'prettier-wrap-threshold:';
export const untilWrapThresholdRegExp = new RegExp(`.*${elementWrapThreshold}`);

export type MultilineArrayOptions = {
    /**
     * If there are MORE elements in the array than this, the array will be forced to wrap.
     *
     * The default is 0, which indicates that all arrays with any elements will wrap.
     *
     * Set to 1 to only wrap if there are more than 1 element. Etc.
     */
    multilineArrayWrapThreshold: number;
    elementsPerLinePattern: number[];
};

export const optionHelp: Record<keyof MultilineArrayOptions, string> = {
    multilineArrayWrapThreshold: `A number indicating that all arrays should wrap when they have MORE than the specified number. Defaults to 0, indicating that all arrays will wrap.\nExample: multilineArrayWrapThreshold: 3,\nCan be overridden with a comment starting with ${elementWrapThreshold}.\nComment example: // ${elementWrapThreshold} 5`,
    elementsPerLinePattern: `An array of numbers indicating how many elements should be on each line. The pattern repeats if an array is longer than the pattern. Defaults to an empty array. Any invalid array elements causes the whole pattern to revert to the default.\nThis overrides the wrap threshold option.\nExample: elementsPerLinePattern: [3, 2, 1],\nCan be overridden with a comment starting with ${elementsPerLineTrigger}.\nComment example: // ${elementsPerLineTrigger} 3 2 1`,
};

const optionPropertyValidators: {
    [Property in keyof MultilineArrayOptions]: (
        input: any,
    ) => input is MultilineArrayOptions[Property];
} = {
    multilineArrayWrapThreshold: (input): input is number =>
        typeof input === 'number' && !isNaN(input),
    elementsPerLinePattern: (input): input is number[] =>
        Array.isArray(input) &&
        !!input.length &&
        input.every((entry) => typeof entry === 'number' && !isNaN(entry)),
};

export const defaultMultilineArrayOptions: MultilineArrayOptions = {
    multilineArrayWrapThreshold: 0,
    elementsPerLinePattern: [],
};

export function fillInOptions(input: unknown): MultilineArrayOptions {
    if (!input || typeof input !== 'object') {
        return defaultMultilineArrayOptions;
    }
    const newOptions: MultilineArrayOptions = {} as any;
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
