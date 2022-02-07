export function capitalizeFirst(input: string): string {
    if (!input) {
        return input;
    }
    return (input[0] || '').toUpperCase() + input.slice(1);
}
