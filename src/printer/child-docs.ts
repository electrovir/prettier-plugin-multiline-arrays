import {Doc, doc} from 'prettier';

export function hasChildDocs(
    input: Doc,
): input is
    | doc.builders.Doc[]
    | doc.builders.Align
    | doc.builders.Concat
    | doc.builders.Fill
    | doc.builders.Group
    | doc.builders.Indent
    | doc.builders.LineSuffix {
    return extractChildDocs(input) !== undefined;
}

export function extractChildDocs(input: Doc): Doc[] | undefined {
    if (typeof input === 'string') {
        return undefined;
    } else if (Array.isArray(input)) {
        return input;
    } else if ('contents' in input) {
        return Array.isArray(input.contents) ? input.contents : [input.contents];
    } else if ('parts' in input) {
        return input.parts;
    } else {
        return undefined;
    }
}

export function walkDoc(
    startDoc: Doc,
    /** Return something truthy to prevent walking of child docs */
    callback: (
        currentDoc: Doc,
        parent: Doc | undefined,
        index: number | undefined,
    ) => boolean | void | undefined,
    parent: Doc | undefined = undefined,
    index: number | undefined = undefined,
): void {
    if (callback(startDoc, parent, index)) {
        return;
    }
    if (typeof startDoc === 'string') {
        return;
    } else if (Array.isArray(startDoc)) {
        startDoc.forEach((innerDoc, index) => walkDoc(innerDoc, callback, startDoc, index));
        return;
    } else if ('contents' in startDoc) {
        walkDoc(startDoc.contents, callback, startDoc, undefined);
        return;
    } else if ('parts' in startDoc) {
        walkDoc(startDoc.parts, callback, startDoc, undefined);
        return;
    } else {
        return;
    }
}
