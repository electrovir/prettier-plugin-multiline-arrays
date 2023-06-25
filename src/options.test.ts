import {itCases} from '@augment-vir/chai';
import {MultilineArrayOptions, optionPropertyValidators} from './options';

describe('optionPropertyValidators', () => {
    itCases(
        (optionType: keyof MultilineArrayOptions, input: unknown) => {
            return optionPropertyValidators[optionType](input);
        },
        [
            {
                it: 'accepts true for multilineFunctionArguments',
                inputs: [
                    'multilineFunctionArguments',
                    true,
                ],
                expect: true,
            },
            {
                it: 'accepts false for multilineFunctionArguments',
                inputs: [
                    'multilineFunctionArguments',
                    false,
                ],
                expect: true,
            },
            {
                it: 'rejects numbers for multilineFunctionArguments',
                inputs: [
                    'multilineFunctionArguments',
                    42,
                ],
                expect: false,
            },
            {
                it: 'allows -1 for multilineArraysWrapThreshold',
                inputs: [
                    'multilineArraysWrapThreshold',
                    -1,
                ],
                expect: true,
            },
            {
                it: 'allows numbers for multilineArraysWrapThreshold',
                inputs: [
                    'multilineArraysWrapThreshold',
                    63,
                ],
                expect: true,
            },
            {
                it: 'rejects strings for multilineArraysWrapThreshold',
                inputs: [
                    'multilineArraysWrapThreshold',
                    '63',
                ],
                expect: false,
            },
            {
                it: 'allows numeric strings for multilineArraysLinePattern',
                inputs: [
                    'multilineArraysLinePattern',
                    '63',
                ],
                expect: true,
            },
            {
                it: 'rejects non-numeric strings for multilineArraysLinePattern',
                inputs: [
                    'multilineArraysLinePattern',
                    '63 keys',
                ],
                expect: false,
            },
        ],
    );
});
