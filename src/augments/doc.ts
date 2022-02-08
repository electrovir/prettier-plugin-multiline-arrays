import {Doc, doc} from 'prettier';

type NestedStringArray = (string | NestedStringArray)[];

export function stringifyDoc(input: Doc): NestedStringArray {
    if (typeof input === 'string') {
        return [
            input,
        ];
    } else if (Array.isArray(input)) {
        return input.map((entry) => stringifyDoc(entry));
    } else {
        return [
            input.type,
        ];
    }
}

export function isDocCommand(
    inputDoc: Doc | undefined | null,
): inputDoc is doc.builders.DocCommand {
    return !!inputDoc && typeof inputDoc !== 'string' && !Array.isArray(inputDoc);
}
