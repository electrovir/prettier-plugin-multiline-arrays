# v1.0 breaking changes

-   `prettier-elements-per-line` comment renamed to `prettier-multiline-arrays-next-line-pattern`.
-   `prettier-wrap-threshold` comment renamed to `prettier-multiline-arrays-next-threshold`.
-   Default `multilineArraysWrapThreshold` value is now `1`.
-   Trailing commas now force wrapping, even if the threshold hasn't been met.

# prettier-plugin-multiline-arrays

Prettier plugin to force array elements to wrap onto new lines, even when there's only one element. Supports control of how many elements appear on each line. Trailing commas will always force a wrap.

TypeScript, JavaScript, and JSON files are officially supported (others may still work).

[Please file issues in the GitHub repo](https://github.com/electrovir/prettier-plugin-multiline-arrays/issues/new) and include code examples if you come across formatting errors. You can set the `NEW_LINE_DEBUG` environment variable to something truthy to get extra debug output when formatting.

# Usage

Add this config to your prettierrc file:

<!-- example-link: src/readme-examples/prettier-options.example.ts -->

```TypeScript
import {Config} from 'prettier';

const prettierConfig: Config = {
    plugins: [
        // relative paths are usually required so Prettier can find the plugin
        './node_modules/prettier-plugin-multiline-arrays', // plugin added here
    ],
    printWidth: 100,
    singleQuote: true,
    tabWidth: 4,
};

module.exports = prettierConfig;
```

The order of your plugins array is very important, so if it doesn't work initial try rearranging them. For an example, check out the plugin ordering for this package's Prettier config: [`./prettierrc.js`](https://github.com/electrovir/prettier-plugin-multiline-arrays/blob/main/.prettierrc.js)

# Options

This plugin makes two new options available to your Prettier config:

-   **`multilineArraysWrapThreshold`**: This is a single number which controls when arrays wrap. If an array has _more_ elements than the number specified here, it will be forced to wrap. This option defaults to `1`, which indicates that all arrays with more than 1 element will wrap. Example JSON: `"multilineArraysWrapThreshold": 3,`. The comment override for this option is `prettier-multiline-arrays-next-threshold`.
-   **`multilineArraysLinePattern`**: This is a single string which contains a space separated list of numbers. These numbers allow fine grained control over how many elements appear in each line. The pattern will repeat if the array has more elements than the pattern. See the `Examples` section for how this works. Defaults to just `1`, which indicates all array lines have just a single element. Example: `"multilineArraysLinePattern": "2 1"`, which means the first line will have 2 elements, the second will have 1, the third will have 2, the fourth will have 1, and so on. _This option overrides Prettier's default wrapping; multiple elements on one line will not be wrapped even if they don't fit within the column count._ The comment override for this option is `prettier-multiline-arrays-next-line-pattern`.

# Comment overrides

-   Add a comment starting with `prettier-multiline-arrays-next-threshold:` followed by a single number to control the wrap threshold for the following line. When an array has _more_ elements than this number, it wraps. The default is `1`, which indicates that arrays with more than 1 element will wrap. Example: `// prettier-multiline-arrays-next-threshold: 5`
-   Add a comment starting with `prettier-multiline-arrays-next-line-pattern:` followed by a pattern of numbers to control how many elements will appear on each line for an array on the following line. Example: `// prettier-elements-per-line: 2 1 3`. The default is just `1`. Any given pattern will repeat endlessly. See the `Examples` section below. _This option overrides Prettier's default wrapping; multiple elements on one line will not be wrapped even if they don't fit within the column count._

To set a comment override for multiple arrays following the comment, change `next` to `set`. Examples:

-   `prettier-multiline-arrays-set-threshold: 5`
-   `prettier-multiline-arrays-set-line-pattern: 2 1 3`

To later undo a `set` comment, use `prettier-multiline-arrays-reset`.

# Examples

-   Not formatted:

    <!-- example-link: src/readme-examples/not-formatted.example.ts -->

    ```TypeScript
    // prettier-ignore
    export const myArray = ['a', 'b', 'c'];

    // prettier-ignore
    export const myCustomArray = ['a', 'b', 'c', 'd', 'e']
    ```

-   Removing the `prettier-ignore` comments leads to formatting like this:

    <!-- example-link: src/readme-examples/formatted.example.ts -->

    ```TypeScript
    export const myArray = [
        'a',
        'b',
        'c',
    ];

    export const myCustomArray = [
        'a',
        'b',
        'c',
        'd',
        'e',
    ];
    ```

-   Use comment overrides to affect wrapping:

    <!-- example-link: src/readme-examples/formatted-with-comments.example.ts -->

    ```TypeScript
    // prettier-multiline-arrays-next-line-pattern: 2 1
    export const linePatternArray = [
        'a', 'b',
        'c',
        'd', 'e',
    ];

    // prettier-multiline-arrays-next-threshold: 10
    export const highThresholdArray = ['a', 'b', 'c', 'd', 'e'];

    // this example wraps because a trailing comma was included, which forces wrapping despite
    // the high threshold comment.
    // prettier-multiline-arrays-next-threshold: 10
    export const highThresholdWithTrailingComma = [
        'a',
        'b',
        'c',
        'd',
        'e',
    ];
    ```

# Compatibility

Tested to be compatible with the following plugins. It is likely compatible with most/all others as well. This plugin must be placed in the order specified above in the `Usage` section.

-   `prettier-plugin-sort-json`
-   `prettier-plugin-packagejson`
-   `prettier-plugin-organize-imports`
-   `prettier-plugin-jsdoc`
