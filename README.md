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

# Options

This plugin makes two new options available to your Prettier config:

-   **`multilineArrayWrapThreshold`**: This is a single number which controls when arrays wrap. If an array has _more_ elements than the number specified here, it will be forced to wrap. This option defaults to `0`, which indicates that _all_ non-empty arrays will wrap. Example: `"multilineArrayWrapThreshold": 3,`.
-   **`multilineArrayElementsPerLine`**: This is a single string which contains a space separated list of numbers. These numbers allow fine grained control over how many elements appear in each line. The pattern will repeat if the array has more elements than the pattern. See the `Examples` section for how this works. Defaults to just `1`, which indicates all array lines have just a single element. Example: `"multilineArrayElementsPerLine": "2 1"`, which means the first line will have 2 elements, the second will have 1, the third will have 2, the fourth will have 1, and so on. _This option overrides Prettier's default wrapping; multiple elements on one line will not be wrapped even if they don't fit within the column count._

# Comment overrides

-   Add a comment with `prettier-wrap-threshold:` followed by a single number to control the wrap threshold for the following line. When an array has _more_ elements than this number, it wraps. The default is `0`, which indicates that _all_ arrays will wrap unless they're empty.
-   Add a comment with `prettier-elements-per-line:` followed by a pattern of numbers to control how many elements will appear on each line for an array on the following line. Example: `// prettier-elements-per-line: 2 1 3`. The default is just `1`. Any given pattern will repeat endlessly. See the `Examples` section below. _This option overrides Prettier's default wrapping; multiple elements on one line will not be wrapped even if they don't fit within the column count._

# Examples

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

# Compatibility

Tested to be compatible with the following plugins. It is likely compatible with most/all others as well. This plugin must be placed in the order specified above in the `Usage` section.

-   `prettier-plugin-sort-json`
-   `prettier-plugin-packagejson`
-   `prettier-plugin-organize-imports`
-   `prettier-plugin-jsdoc`
