# prettier-plugin-multiline-arrays

Prettier plugin to forces array elements to wrap onto new lines, even when there's only one element. Supports control of how many elements appear on each line.

Only supports JavaScript and TypeScript.

# Usage

**For this plugin to work you _must_ override the Prettier parser to `multiline-arrays` for `.ts` and `.js` files (or other JavaScript / TypeScript file extensions you're using).** This is a due to the limited nature of Prettier's plugin system.

Add this to your prettierrc file:

```
overrides: [
        {
            files: [
                '*.ts',
                '*.js',
            ],
            options: {
                parser: 'multiline-arrays',
            },
        },
    ],
```

So, as an example, your prettierrc file might look like this:

<!-- example-link: src/readme-examples/prettier-options.ts -->

```TypeScript
import {Config} from 'prettier';

const prettierConfig: Config = {
    overrides: [
        {
            files: [
                '*.ts',
                '*.js',
            ],
            options: {
                parser: 'multiline-arrays',
            },
        },
    ],
    printWidth: 100,
    singleQuote: true,
    tabWidth: 4,
};

module.exports = prettierConfig;
```

## Controlling elements per line

Add a comment with `prettier-elements-per-line:` followed by a pattern of numbers to control how many elements will appear on each line. The default is just `1`. Any given pattern will repeat endlessly. See the example below.

## Example

Not formatted:

<!-- example-link: src/readme-examples/not-formatted.ts -->

```TypeScript
// prettier-ignore
export const myArray = ['a', 'b', 'c'];

// prettier-ignore
// prettier-elements-per-line: 2 1
export const myCustomArray = ['a', 'b', 'c', 'd', 'e']
```

Removing the `prettier-ignore` comments leads to formatting like this:

<!-- example-link: src/readme-examples/formatted.ts -->

```TypeScript
export const myArray = [
    'a',
    'b',
    'c',
];

// prettier-elements-per-line: 2 1
export const myCustomArray = [
    'a', 'b',
    'c',
    'd', 'e',
];
```
