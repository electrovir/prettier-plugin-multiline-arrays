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

function extractChildDocs(input: Doc): Doc[] | undefined {
    if (typeof input === 'string') {
        return undefined;
    } else if (Array.isArray(input)) {
        return input;
    } else if ('contents' in input) {
        return Array.isArray(input.contents)
            ? input.contents
            : [
                  input.contents,
              ];
    } else if ('parts' in input) {
        return input.parts;
    } else {
        return undefined;
    }
}

type Parents = {parent: Doc; childIndexInThisParent: number | undefined};

/**
 * @returns Boolean true means keep walking children and siblings, false means stop walking children
 *   and siblings. Returning false does not stop walking of aunts/uncles or ancestors.
 */
export function walkDoc(
    startDoc: Doc,
    /** Return something falsy to prevent walking of child docs */
    debug: boolean,
    callback: (
        currentDoc: Doc,
        parents: Parents[],
        index: number | undefined,
    ) => boolean | void | undefined,
    parents: Parents[] = [],
    index: number | undefined = undefined,
): boolean {
    if (!startDoc) {
        return true;
    }
    if (debug) {
        const parent = parents[0];
        console.info({
            firingCallbackFor: startDoc,
            status: 'Calling callback',
            parent: parent
                ? {
                      isArray: Array.isArray(parent),
                      type: (parent as any)?.type ?? typeof parent,
                  }
                : undefined,
            index,
        });
    }
    if (!callback(startDoc, parents, index)) {
        // if the callback returns something falsy, don't try to walk its children
        return false;
    }
    if (typeof startDoc === 'string') {
        return true;
    } else if (Array.isArray(startDoc)) {
        if (debug) {
            console.info('walking array children');
        }
        // one a child returns false, abort walking this array
        startDoc.every((innerDoc, index): boolean => {
            return walkDoc(
                innerDoc,
                debug,
                callback,
                [
                    {parent: startDoc, childIndexInThisParent: index},
                    ...parents,
                ],
                index,
            );
        });
    } else if ('contents' in startDoc) {
        if (debug) {
            console.info('walking contents property');
        }
        return walkDoc(
            startDoc.contents,
            debug,
            callback,
            [
                {parent: startDoc, childIndexInThisParent: undefined},
                ...parents,
            ],
            undefined,
        );
    } else if ('parts' in startDoc) {
        if (debug) {
            console.info('walking parts property');
        }
        return walkDoc(
            startDoc.parts,
            debug,
            callback,
            [
                {parent: startDoc, childIndexInThisParent: undefined},
                ...parents,
            ],
            undefined,
        );
    }
    return true;
}

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
