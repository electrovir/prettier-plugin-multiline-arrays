import ansiRegexCreator from 'ansi-regex';

export function capitalizeFirst(input: string): string {
    if (!input) {
        return input;
    }
    return (input[0] || '').toUpperCase() + input.slice(1);
}

export function stripColor(input: string): string {
    return input.replace(ansiRegexCreator(), '');
}
