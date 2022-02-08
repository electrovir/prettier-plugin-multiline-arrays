# prettier-plugin-multiline-arrays

Prettier plugin to force array elements to wrap onto new lines, even when there's only one element. Supports control of how many elements appear on each line.

TypeScript, JavaScript, and JSON files are supported.

# Usage

Add this config to your prettierrc file. The order of your plugins array is very important, so if it doesn't work initial try rearranging them. For example, here is the plugin ordering for this package's Prettier config:

<!-- example-link: src/readme-examples/prettier-options.ts -->

```TypeScript
import {Config} from 'prettier';

const prettierConfig: Config = {
    plugins: [
        'prettier-plugin-sort-json',
        'prettier-plugin-packagejson',
        'prettier-plugin-multiline-arrays', // plugin added here
        'prettier-plugin-organize-imports',
        'prettier-plugin-jsdoc',
    ],
    printWidth: 100,
    singleQuote: true,
    tabWidth: 4,
};

module.exports = prettierConfig;
```

## Controlling elements per line

Add a comment with `prettier-elements-per-line:` followed by a pattern of numbers to control how many elements will appear on each line: `// prettier-elements-per-line: 2 1 3`. The default is just `1`. Any given pattern will repeat endlessly. See the example section below.

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

## Compatibility

Tested to be compatible with the following plugins. It is likely compatible with most/all others as well.

-   `prettier-plugin-sort-json`
-   `prettier-plugin-packagejson`
-   `prettier-plugin-organize-imports`
-   `prettier-plugin-jsdoc`
