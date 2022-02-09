import {stripColor} from './string';

describe(stripColor.name, () => {
    it('should remove color encodings', () => {
        const input =
            'Invalid \x1B[31mmultilineArrayWrapThreshold\x1B[39m value. Expected an integer\x1B[39m, but received \x1B[31m"fifty two"\x1B[39m.';
        const output = stripColor(input);
        const expected =
            'Invalid multilineArrayWrapThreshold value. Expected an integer, but received "fifty two".';
        if (output !== expected) {
            console.error({output});
        }
        expect(output).toBe(expected);
    });
});
