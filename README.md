# prettier-plugin-multiline-arrays

Prettier plugin to force array elements to wrap onto new lines, even when there's only one element. Supports control of how many elements appear on each line. Trailing commas will always force a wrap.

TypeScript, JavaScript, and JSON files are officially supported (others may still work).

[Please file issues in the GitHub repo](https://github.com/electrovir/prettier-plugin-multiline-arrays/issues/new) and include code examples if you come across formatting errors. You can set the `NEW_LINE_DEBUG` environment variable to something truthy to get extra debug output when formatting.

# Usage

Add this config to your prettierrc file:

<!-- example-link: src/readme-examples/prettier-options.example.ts -->

```TypeScript
module.exports = {
    plugins: [
        // relative paths are usually required so Prettier can find the plugin
        './node_modules/prettier-plugin-multiline-arrays', // plugin added here
    ],
    printWidth: 100,
    singleQuote: true,
    tabWidth: 4,
};
```

The order of your plugins array is very important, so if you have other plugins and they don't work initially, try rearranging them. For an example, check out the plugin ordering for this package's Prettier config: [`./prettierrc.js`](https://github.com/electrovir/prettier-plugin-multiline-arrays/blob/main/.prettierrc.js)

# Options

This plugin makes two new options available to your Prettier config:

-   **`multilineArraysWrapThreshold`**: This should be set to a single number which controls when arrays wrap. If an array has _more_ elements than the number specified here, it will be forced to wrap. This option defaults to `1`, which indicates that all arrays with more than 1 element will wrap. Example JSON: `"multilineArraysWrapThreshold": 3,`. To override this option for an array, precede the array with a comment like so: `// prettier-multiline-arrays-next-threshold: 4`.
-   **`multilineArraysLinePattern`**: This should be set to a string which contains a space separated list of numbers. These numbers allow fine grained control over how many elements appear in each line. The pattern will repeat if an array has more elements than the pattern. See the `Examples` section for how this works. This defaults to just `1`, which indicates all array lines have just a single element. Example: `"multilineArraysLinePattern": "2 1"`, which means the first line will have 2 elements, the second will have 1, the third will have 2, the fourth will have 1, and so on. If set, _this option overrides Prettier's default wrapping; multiple elements on one line will not be wrapped even if they don't fit within the column count._ To override this option for an array, precede the array with a comment like so: `// prettier-multiline-arrays-next-line-pattern: 2 1`.
-   **`multilineFunctionArguments`**: **Experimental**: Applies all array wrapping logic to function argument lists as well.

# Comment overrides

-   Add a comment starting with `prettier-multiline-arrays-next-threshold:` followed by a single number to control the wrap threshold for the following line. When an array has _more_ elements than this number, it wraps. The default is `1`, which indicates that arrays with more than 1 element will wrap. Example: `// prettier-multiline-arrays-next-threshold: 5`
-   Add a comment starting with `prettier-multiline-arrays-next-line-pattern:` followed by a pattern of numbers to control how many elements will appear on each line for an array on the following line. Example: `// prettier-elements-per-line: 2 1 3`. The default is just `1`. Any given pattern will repeat endlessly. See the `Examples` section below. _This option overrides Prettier's default wrapping; multiple elements on one line will not be wrapped even if they don't fit within the column count._

To set a comment override for all arrays in a file following the comment, change `next` to `set`. Examples:

-   `prettier-multiline-arrays-set-threshold: 5`
-   `prettier-multiline-arrays-set-line-pattern: 2 1 3`

To later undo a `set` comment, use `prettier-multiline-arrays-reset`, which resets the options to whatever you have set in prettierrc, or the default values.

# Examples

-   Not formatted:

    <!-- example-link: src/readme-examples/not-formatted.example.ts -->

    ```TypeScript
    // prettier-ignore
    export const myArray = ['a', 'b', 'c'];

    // prettier-ignore
    export const myCustomArray = ['a', 'b', 'c', 'd', 'e']
    ```

-   Removing the `prettier-ignore` comments leads to formatting like this (with the default options):

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

Tested to be compatible with the following plugins. It is likely compatible with many others as well. This plugin must be placed in the order specified below.

1.  `prettier-plugin-sort-json`
2.  `prettier-plugin-packagejson`
3.  insert this plugin here
4.  `prettier-plugin-organize-imports`
5.  `prettier-plugin-jsdoc`
