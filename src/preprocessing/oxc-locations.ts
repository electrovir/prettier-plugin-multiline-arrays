type NodeWithLocation = Partial<{
    declaration: Partial<{
        decorators: NodeWithLocation[];
    }>;
    decorators: NodeWithLocation[];
    end: number;
    range: [
        number,
        number,
    ];
    start: number;
}>;

export type LineLocation = {
    column: number;
    line: number;
};

export function oxcLocStart(node: NodeWithLocation): number {
    const firstDecorator = node.declaration?.decorators?.[0] ?? node.decorators?.[0];
    return firstDecorator ? oxcLocStart(firstDecorator) : (node.range?.[0] ?? node.start ?? 0);
}

export function oxcLocEnd(node: NodeWithLocation): number {
    return node.range?.[1] ?? node.end ?? 0;
}

export function createLocationFinder(text: string): (index: number) => LineLocation {
    const lineStartIndexes = [0];

    let characterIndex = 0;
    for (const character of text) {
        if (character === '\n') {
            lineStartIndexes.push(characterIndex + 1);
        }
        characterIndex += character.length;
    }

    return (characterIndex) => {
        let lowIndex = 0;
        let highIndex = lineStartIndexes.length - 1;

        while (lowIndex <= highIndex) {
            const middleIndex = Math.floor((lowIndex + highIndex) / 2);
            const lineStartIndex = lineStartIndexes[middleIndex];
            const nextLineStartIndex = lineStartIndexes[middleIndex + 1] ?? Infinity;

            if (lineStartIndex == undefined || characterIndex < lineStartIndex) {
                highIndex = middleIndex - 1;
            } else if (characterIndex >= nextLineStartIndex) {
                lowIndex = middleIndex + 1;
            } else {
                return {
                    column: characterIndex - lineStartIndex,
                    line: middleIndex + 1,
                };
            }
        }

        return {
            column: characterIndex,
            line: 1,
        };
    };
}

export function addLocationsToAst(input: unknown, text: string): void {
    const getLocation = createLocationFinder(text);
    const visitedObjects = new WeakSet<object>();

    function addLocations(currentInput: unknown): void {
        if (!currentInput || typeof currentInput !== 'object' || visitedObjects.has(currentInput)) {
            return;
        }

        visitedObjects.add(currentInput);

        if (Array.isArray(currentInput)) {
            currentInput.forEach((entry) => addLocations(entry));
            return;
        }

        const currentNode = currentInput as NodeWithLocation & {
            loc?: {
                end: LineLocation;
                start: LineLocation;
            };
        };
        const hasLocation =
            !!currentNode.range || currentNode.start != undefined || currentNode.end != undefined;
        const start = oxcLocStart(currentNode);
        const end = oxcLocEnd(currentNode);

        if (hasLocation && !currentNode.loc && start >= 0 && end >= start) {
            currentNode.loc = {
                end: getLocation(end),
                start: getLocation(start),
            };
        }

        Object.entries(currentInput).forEach(
            ([
                key,
                value,
            ]) => {
                if (key !== 'loc') {
                    addLocations(value);
                }
            },
        );
    }

    addLocations(input);
}
