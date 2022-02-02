import {RequiredBy} from 'augment-vir';
import type {Comment, Node} from 'estree';
import {Doc, doc, ParserOptions, Plugin, Printer, RequiredOptions} from 'prettier';
import {parsers as tsParsers} from 'prettier/parser-typescript';
import {
    astFormatName,
    lineContainsTriggerComment,
    parserName,
    untilLineTriggerRegExp,
} from './names';

type JsPlugin = RequiredBy<Plugin<any>, 'printers'> & {printers: {estree: Printer<any>}};

function isJsPlugin(jsPlugin: undefined | Plugin<any> | string): jsPlugin is JsPlugin {
    if (!jsPlugin) {
        return false;
    }
    if (typeof jsPlugin === 'string') {
        return false;
    }

    if (!jsPlugin.printers) {
        return false;
    }

    if (!jsPlugin.printers.estree) {
        return false;
    }

    return true;
}

function hasChildDocs(
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
        return Array.isArray(input.contents) ? input.contents : [input.contents];
    } else if ('parts' in input) {
        return input.parts;
    } else {
        return undefined;
    }
}

function walkDoc(
    startDoc: Doc,
    /** Return something truthy to prevent walking of child docs */
    callback: (currentDoc: Doc) => boolean | void | undefined,
): void {
    if (callback(startDoc)) {
        return;
    }
    if (typeof startDoc === 'string') {
        return;
    } else if (Array.isArray(startDoc)) {
        startDoc.forEach((innerDoc) => walkDoc(innerDoc, callback));
        return;
    } else if ('contents' in startDoc) {
        walkDoc(startDoc.contents, callback);
        return;
    } else if ('parts' in startDoc) {
        walkDoc(startDoc.parts, callback);
        return;
    } else {
        return;
    }
}

function insertArrayLines(inputDoc: Doc, lineCounts: number[]): Doc {
    let outerDoc: Doc = inputDoc;
    // pull to contents out of an array with just a single group in it
    if (Array.isArray(inputDoc) && inputDoc.filter((entry) => !!entry).length === 1) {
        outerDoc = inputDoc[0] ?? [];
        if (typeof outerDoc !== 'string') {
            if ('contents' in outerDoc) {
                outerDoc = outerDoc.contents;
            } else if ('parts' in outerDoc) {
                outerDoc = outerDoc.parts;
            }
        }
    }

    if (typeof outerDoc === 'string') {
        return outerDoc;
    }

    let lineIndex = 0;
    /**
     * Start on zeroth column as we want to ignore the first line, which then increments this to 1.
     * (column count is 1 indexed)
     */
    let columnCount = 0;
    // start at -1 because the first '[' will then stick us on level 0
    let nestedDepth = -1;

    walkDoc(outerDoc, (currentDoc) => {
        const childDocs = extractChildDocs(currentDoc);
        if (childDocs) {
            childDocs.forEach((childDoc, childIndex) => {
                // console.log({childDoc, nestedDepth});
                if (typeof childDoc === 'string') {
                    if (childDoc === '[') {
                        nestedDepth++;
                    } else if (childDoc === ']') {
                        nestedDepth--;
                    }
                } else if (hasChildDocs(childDoc)) {
                    return;
                } else if (childDoc.type === 'line' && childDoc.soft) {
                    childDocs[childIndex] = doc.builders.hardlineWithoutBreakParent;
                } else if (nestedDepth < 1) {
                    if (childDoc.type === 'line') {
                        let shouldLineBreak = false;
                        const currentLineCountIndex = lineIndex % lineCounts.length;
                        const currentLineCount: number | undefined = lineCounts.length
                            ? lineCounts[currentLineCountIndex]
                            : undefined;
                        // console.log({
                        //     currentLineCount,
                        //     currentLineCountIndex,
                        //     lineIndex,
                        //     columnCount,
                        // });
                        if (
                            (currentLineCount && columnCount === currentLineCount) ||
                            !currentLineCount
                        ) {
                            // if we're on the last element of the line then increment to the next line
                            lineIndex++;
                            columnCount = 1;
                            shouldLineBreak = true;
                        } else {
                            columnCount++;
                        }
                        if (shouldLineBreak) {
                            childDocs[childIndex] = doc.builders.hardlineWithoutBreakParent;
                        }
                    } else if (childDoc.type === 'if-break') {
                        childDoc.flatContents = childDoc.breakContents;
                    }
                }
            });
        }
    });

    return outerDoc;
}

let jsPlugin: JsPlugin | undefined;

function getAndSetJsPlugin(options: ParserOptions<any>) {
    if (!jsPlugin) {
        const findPlugin = options.plugins.find(
            (plugin) => typeof plugin !== 'string' && plugin.printers && plugin.printers.estree,
        );
        if (!isJsPlugin(findPlugin)) {
            throw new Error(`Could not find default JS plugin.`);
        }
        jsPlugin = findPlugin;
    }

    return jsPlugin;
}

function findOptionsArgument(input: any[]): ParserOptions<any> | undefined {
    const props: (keyof RequiredOptions)[] = ['semi', 'singleQuote', 'tabWidth'];
    return input.find((entry) => {
        return props.every((prop) => entry.hasOwnProperty(prop));
    });
}

const mappedComments = new WeakMap<Node, Record<number, number[]>>();

const printWithNewLineArrays: Printer['print'] = (path, options, print) => {
    if (!jsPlugin) {
        jsPlugin = getAndSetJsPlugin(options);
    }

    const programNode = path.stack[0];
    if (!programNode) {
        throw new Error(`Could not find program node in ${path.stack.join(',')}`);
    }
    const node = path.getValue() as Node | undefined;
    if (node) {
        if (
            node.type === 'ArrayExpression' ||
            node.type === 'ArrayPattern' ||
            (node.type as any) === 'TupleExpression'
        ) {
            const printedArray = jsPlugin.printers.estree.print(path, options, print);

            if (!node.loc) {
                throw new Error(
                    `Could not find location of node ${'value' in node ? node.value : node.type}`,
                );
            }

            const lineCounts = mappedComments.get(programNode)?.[node.loc.start.line - 1] ?? [];

            // console.log({lineCounts});
            const newDoc = insertArrayLines(printedArray, lineCounts);
            return newDoc;
        } else if (node.type === 'Program') {
            const comments: Comment[] =
                node.comments ??
                node.body
                    .reduce((accum, entry) => {
                        if ((entry as any).comments) {
                            accum.push(...((entry as any).comments as Comment[]));
                        }
                        return accum;
                    }, [] as Comment[])
                    .flat();
            // console.log({comments});
            if (comments && comments.length) {
                const keyedCommentsByLastLine: Record<number, number[]> = comments.reduce(
                    (accum, currentComment) => {
                        const commentText = currentComment.value?.replace(/\n/g, ' ');
                        if (commentText?.includes(lineContainsTriggerComment)) {
                            const split = commentText
                                .replace(untilLineTriggerRegExp, '')
                                .split(' ');
                            const numbers = split
                                .map((entry) =>
                                    entry && entry.trim().match(/\d+/) ? Number(entry) : NaN,
                                )
                                .filter((entry) => !isNaN(entry));
                            if (!currentComment.loc) {
                                throw new Error(
                                    `Cannot read line location for comment ${currentComment.value}`,
                                );
                            }
                            accum[currentComment.loc.end.line] = numbers;
                        }
                        return accum;
                    },
                    {} as Record<number, number[]>,
                );

                // console.log({keyedCommentsByLastLine});
                // save to a map so we don't have to recalculate these every time
                mappedComments.set(node, keyedCommentsByLastLine);
            }
        }
    }

    return jsPlugin.printers.estree.print(path, options, print);
};

function getJsPrinter(args: any[]): Printer<any> {
    if (!jsPlugin) {
        const options = findOptionsArgument(args);
        if (options) {
            getAndSetJsPlugin(options);
        } else {
            throw new Error(`Could not find options argument.`);
        }
    }
    if (jsPlugin) {
        return jsPlugin.printers.estree;
    } else {
        throw new Error('could not find js plugin for making a printer call');
    }
}

let printer: Printer<Node> = new Proxy<Printer<Node>>(
    {
        print: printWithNewLineArrays,
    },
    {
        get: (target, property: keyof Printer) => {
            if (property === 'handleComments') {
                return undefined;
            }
            return (...args: any[]) => {
                const jsPrinter = getJsPrinter(args);
                if (property === 'print') {
                    return target.print.apply(jsPrinter, args as any);
                } else if (property === 'printComment') {
                    return jsPrinter.printComment?.apply(jsPrinter, args as any);
                } else {
                    return (jsPrinter[property] as Function | undefined)?.apply(jsPrinter, args);
                }
            };
        },
    },
);

const newlineArraysPlugin: Plugin = {
    languages: [
        {
            name: 'typescript',
            parsers: [parserName],
        },
    ],
    parsers: {
        [parserName]: {
            ...tsParsers['typescript'],
            astFormat: astFormatName,
        },
    },
    printers: {
        [astFormatName]: printer,
    },
};

module.exports = newlineArraysPlugin;
