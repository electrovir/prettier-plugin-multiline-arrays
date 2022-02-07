import {RequiredBy} from 'augment-vir';
import {ParserOptions, Plugin, Printer, RequiredOptions} from 'prettier';

export let jsPlugin: JsPlugin | undefined;

export type JsPlugin = RequiredBy<Plugin<any>, 'printers'> & {printers: {estree: Printer<any>}};

export function isJsPlugin(jsPlugin: undefined | Plugin<any> | string): jsPlugin is JsPlugin {
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

export function getAndSetJsPlugin(options: ParserOptions<any>) {
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

let originalPrinter: Printer | undefined;

export function setOriginalPrinter(input: Printer) {
    originalPrinter = input;
}

export function getOriginalPrinter(): Printer {
    if (!originalPrinter) {
        throw new Error(`originalPrinter hasn't been defined yet!`);
    }
    return originalPrinter;
}

function findOptionsArgument(input: any[]): ParserOptions<any> | undefined {
    const props: (keyof RequiredOptions)[] = [
        'semi',
        'singleQuote',
        'tabWidth',
    ];
    return input.find((entry) => {
        return props.every((prop) => entry.hasOwnProperty(prop));
    });
}

export function getJsPrinter(args: any[]): Printer<any> {
    return getOriginalPrinter();
    // if (!jsPlugin) {
    //     const options = findOptionsArgument(args);
    //     if (options) {
    //         getAndSetJsPlugin(options);
    //     } else {
    //         throw new Error(`Could not find options argument.`);
    //     }
    // }
    // if (jsPlugin) {
    //     return jsPlugin.printers.estree;
    // } else {
    //     throw new Error('could not find js plugin for making a printer call');
    // }
}
