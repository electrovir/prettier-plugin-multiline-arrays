import {Node} from 'estree';
import {Printer} from 'prettier';
import {printWithNewLineArrays} from './insert-new-lines';
import {getJsPrinter} from './jsplugin';

export const printer = new Proxy<Printer<Node>>(
    {
        print: printWithNewLineArrays,
    },
    {
        get: (target, property: keyof Printer) => {
            /**
             * "handleComments" is the only printer property which isn't a callback function, so for
             * simplicity, ignore it.
             */
            if (property === 'handleComments') {
                return undefined;
            }
            /** We have to return a callback so that we can extract the jsPlugin from the options argument */
            return (...args: any[]) => {
                const jsPrinter = getJsPrinter(args);
                if (property === 'print') {
                    return target.print.apply(jsPrinter, args as any);
                } else {
                    return (jsPrinter[property] as Function | undefined)?.apply(jsPrinter, args);
                }
            };
        },
    },
);
