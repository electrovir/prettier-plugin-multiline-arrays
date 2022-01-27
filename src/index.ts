import {RequiredBy} from 'augment-vir';
import {AstPath, Doc, Plugin, Printer} from 'prettier';
import {parsers as tsParsers} from 'prettier/parser-typescript';
import {astFormatName, parserName} from './names';

function isJsPlugin(
    jsPlugin: undefined | Plugin<any> | string,
): jsPlugin is RequiredBy<Plugin<any>, 'printers'> & {printers: {estree: Printer<any>}} {
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

function replaceSoftLines(doc: Doc): Doc {
    if (typeof doc === 'string') {
        return doc;
    } else if (Array.isArray(doc)) {
        return doc.map((innerDoc) => {
            return replaceSoftLines(innerDoc);
        });
    } else {
        if ('contents' in doc) {
            return {
                ...doc,
                contents: replaceSoftLines(doc.contents),
            };
        } else if (doc.type === 'line') {
            let newDoc: Doc = {...doc};
            if (!doc.hard) {
                delete newDoc.soft;
                newDoc.hard = true;
            } else if (doc.hard) {
                newDoc = '';
            }
            return newDoc;
        } else if (doc.type === 'if-break') {
            return replaceSoftLines(doc.breakContents);
        } else {
            return doc;
        }
    }
}

const prettierStuff: Plugin = {
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
        [astFormatName]: {
            print(path, options, print) {
                const jsPlugin = options.plugins.find(
                    (plugin) =>
                        typeof plugin !== 'string' && plugin.printers && plugin.printers.estree,
                );
                if (!isJsPlugin(jsPlugin)) {
                    throw new Error(`Could not find default JS plugin.`);
                }

                const node = path.getValue() as {type: string; elements: AstPath<any>[]};

                if (
                    node.type === 'ArrayExpression' ||
                    node.type === 'ArrayPattern' ||
                    node.type === 'TupleExpression'
                ) {
                    const printedArray = jsPlugin.printers.estree.print(path, options, print);

                    return replaceSoftLines(printedArray);
                }

                return jsPlugin.printers.estree.print(path, options, print);
            },
        },
    },
};

module.exports = prettierStuff;
