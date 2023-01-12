import {Node} from 'estree';
import {AstPath, ParserOptions, Printer} from 'prettier';
import {envDebugKey, fillInOptions, MultilineArrayOptions} from '../options';
import {printWithMultilineArrays} from './insert-new-lines';
import {getOriginalPrinter} from './original-printer';

const debug = !!process.env[envDebugKey];

function wrapInOriginalPrinterCall<T extends string = string>(
    property: keyof Printer,
    subProperty?: T,
) {
    return (...args: any[]) => {
        const originalPrinter = getOriginalPrinter();

        if (property === 'print') {
            const path = args[0] as AstPath;
            const options = args[1] as ParserOptions;
            const originalOutput = originalPrinter.print.call(
                originalPrinter,
                path,
                options,
                ...(args.slice(2) as [any]),
            );
            if (
                options.filepath &&
                options.filepath.endsWith('package.json') &&
                options.plugins.find(
                    (plugin) =>
                        typeof plugin === 'object' &&
                        (plugin as {name?: string}).name?.includes('prettier-plugin-packagejson'),
                )
            ) {
                return originalOutput;
            }

            const multilineOptions: MultilineArrayOptions & ParserOptions<any> =
                fillInOptions(options);
            return printWithMultilineArrays(originalOutput, args[0], multilineOptions, debug);
        } else {
            let thisParent: any = originalPrinter;
            let printerProp = originalPrinter[property];
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
    endOfLine: wrapInOriginalPrinterCall<keyof NonNullable<Printer['handleComments']>>(
        'handleComments',
        'endOfLine',
    ),
    ownLine: wrapInOriginalPrinterCall<keyof NonNullable<Printer['handleComments']>>(
        'handleComments',
        'ownLine',
    ),
    remaining: wrapInOriginalPrinterCall<keyof NonNullable<Printer['handleComments']>>(
        'handleComments',
        'remaining',
    ),
};

/** This is a proxy because the original printer is only set at run time. */
export const multilineArrayPrinter = new Proxy<Printer<Node>>({} as Printer<Node>, {
    get: (target, property: keyof Printer) => {
        /**
         * "handleComments" is the only printer property which isn't a callback function, so for
         * simplicity, ignore it.
         */
        if (property === 'handleComments') {
            return handleComments;
        }
        /**
         * We have to return a callback so that we can extract the jsPlugin from the options
         * argument
         */
        return wrapInOriginalPrinterCall(property);
    },
});
