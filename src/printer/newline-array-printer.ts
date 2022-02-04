import {Node} from 'estree';
import {Printer} from 'prettier';
import {printWithNewLineArrays} from './insert-new-lines';
import {getJsPrinter} from './jsplugin';

const debug = !!process.env.NEW_LINE_DEBUG;

let jsPrinter: undefined | Printer;

function wrapInJsPrinterCall<T extends string = string>(property: keyof Printer, subProperty?: T) {
    return (...args: any[]) => {
        if (!jsPrinter) {
            jsPrinter = getJsPrinter(args);
        }
        if (!jsPrinter && debug) {
            throw new Error(`Could not find jsPrinter!`);
        }
        if (property === 'print') {
            const originalOutput = jsPrinter.print.call(jsPrinter, ...(args as [any, any, any]));
            return printWithNewLineArrays(originalOutput, args[0], debug);
        } else {
            let thisParent: any = jsPrinter;
            let printerProp = jsPrinter[property];
            if (subProperty) {
                thisParent = printerProp;
                printerProp = (printerProp as any)[subProperty];
            }
            try {
                return (printerProp as Function | undefined)?.apply(thisParent, args);
            } catch (error) {
                const newError = new Error(
                    `Failed to wrap JS printer call for property "${property}" ${
                        subProperty ? `and subProperty "${subProperty}"` : ''
                    }: \n`,
                );
                if (error instanceof Error && error.stack) {
                    newError.stack = newError.message + error.stack;
                }
                throw newError;
            }
        }
    };
}

const handleComments: Printer['handleComments'] = {
    // the avoidAstMutation property is not defined in the types
    // @ts-expect-error
    avoidAstMutation: true,
    endOfLine: wrapInJsPrinterCall<keyof NonNullable<Printer['handleComments']>>(
        'handleComments',
        'endOfLine',
    ),
    ownLine: wrapInJsPrinterCall<keyof NonNullable<Printer['handleComments']>>(
        'handleComments',
        'ownLine',
    ),
    remaining: wrapInJsPrinterCall<keyof NonNullable<Printer['handleComments']>>(
        'handleComments',
        'remaining',
    ),
};

export const newlineArrayPrinter = new Proxy<Printer<Node>>({} as Printer<Node>, {
    get: (target, property: keyof Printer) => {
        /**
         * "handleComments" is the only printer property which isn't a callback function, so for
         * simplicity, ignore it.
         */
        if (property === 'handleComments') {
            return handleComments;
        }
        /** We have to return a callback so that we can extract the jsPlugin from the options argument */
        return wrapInJsPrinterCall(property);
    },
});
