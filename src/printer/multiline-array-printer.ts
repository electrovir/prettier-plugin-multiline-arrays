import {assertWrap} from '@augment-vir/assert';
import {type Node} from 'estree';
import {type AstPath, type Doc, type ParserOptions, type Printer} from 'prettier';
import estreePluginModule from 'prettier/plugins/estree';
import {type MultilineArrayOptions, envDebugKey, fillInOptions} from '../options.js';
import {printWithMultilineArrays} from './insert-new-lines.js';

/**
 * The estree plugin is bundled with Prettier and exposes the base printers we want to wrap. Its
 * types don't currently export `printers`, so we access it via the module's exported value.
 */
const estreePlugin = estreePluginModule as unknown as {
    printers: Record<string, Printer<Node>>;
};

const debug = !!process.env[envDebugKey];

function createMultilineArrayPrinter(basePrinter: Printer<Node>): Printer<Node> {
    return {
        ...basePrinter,
        print(path: AstPath<Node>, options: ParserOptions, print: (path: AstPath<Node>) => Doc) {
            if (debug) {
                console.info(
                    '[multiline-arrays] multilineArrayPrinter.print for node:',
                    path.getNode()?.type,
                );
            }
            const originalOutput = basePrinter.print(path, options, print);

            if (
                (options.filepath as string | undefined)?.endsWith('package.json') &&
                options.plugins.some(
                    (plugin) =>
                        typeof plugin === 'object' &&
                        (plugin as {name?: string}).name?.includes('prettier-plugin-packagejson'),
                )
            ) {
                return originalOutput;
            }

            const multilineOptions: MultilineArrayOptions & ParserOptions = fillInOptions(options);

            return printWithMultilineArrays(originalOutput, path, multilineOptions, debug);
        },
    };
}

export const multilineArrayPrinter: Printer<Node> = createMultilineArrayPrinter(
    assertWrap.isDefined(estreePlugin.printers.estree, 'No ESTree printer found.'),
);

export const multilineJsonPrinter: Printer<Node> = createMultilineArrayPrinter(
    assertWrap.isDefined(estreePlugin.printers['estree-json'], 'No ESTree JSON printer found.'),
);
/**
 * Patch Prettier's built-in estree printers in-place so that any code path using the estree plugin
 * (including Prettier's own internal plugin resolution) will go through our multiline wrappers. We
 * capture the original printers above, so the wrappers still delegate to the unmodified
 * implementations when computing the base Doc.
 *
 * Note: this mutation happens when this module is imported. In normal Prettier usage, plugins are
 * loaded before printers are resolved, so all estree-based printing should go through these
 * wrappers. If some other code caches the original printers _before_ this plugin is loaded, those
 * cached references would bypass the multiline behavior.
 */
estreePlugin.printers.estree = multilineArrayPrinter;
estreePlugin.printers['estree-json'] = multilineJsonPrinter;
