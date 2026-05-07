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

export function createMultilineArrayPrinter(basePrinter: Printer<Node>): Printer<Node> {
    const baseHandleComments = basePrinter.handleComments;

    return {
        ...basePrinter,
        canAttachComment(...args) {
            try {
                return basePrinter.canAttachComment?.(...args) ?? false;
            } catch {
                return true;
            }
        },
        handleComments: baseHandleComments
            ? {
                  ...baseHandleComments,
                  endOfLine(...args) {
                      try {
                          return baseHandleComments.endOfLine?.(...args) ?? false;
                      } catch {
                          return false;
                      }
                  },
                  ownLine(...args) {
                      try {
                          return baseHandleComments.ownLine?.(...args) ?? false;
                      } catch {
                          return false;
                      }
                  },
                  remaining(...args) {
                      try {
                          return baseHandleComments.remaining?.(...args) ?? false;
                      } catch {
                          return false;
                      }
                  },
              }
            : undefined,
        /**
         * The 4th parameter `args` is used by Prettier internally. We must declare it to preserve
         * the function's arity (Function.length), which Prettier checks to determine behavior.
         * Without this 4th parameter, Prettier's internal printing logic behaves differently,
         * causing incorrect output for non-array code (like function calls).
         */
        print(
            path: AstPath<Node>,
            options: ParserOptions,
            print: (path: AstPath<Node>) => Doc,
            args?: unknown,
        ) {
            if (debug) {
                console.info(
                    '[multiline-arrays] multilineArrayPrinter.print for node:',
                    path.getNode()?.type,
                );
            }
            const originalOutput = (
                basePrinter.print as (
                    path: AstPath<Node>,
                    options: ParserOptions,
                    print: (path: AstPath<Node>) => Doc,
                    args?: unknown,
                ) => Doc
            )(path, options, print, args);

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
