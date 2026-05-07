import {type Node} from 'estree';
import {type AstPath, type Doc, doc} from 'prettier';
import {type CommentTriggers, type PreservedComment} from './comment-triggers.js';

function formatPreservedComment(comment: PreservedComment): string {
    return comment.type === 'Block' ? `/*${comment.value}*/` : `//${comment.value}`;
}

function getSourceTextAtCommentLocation(
    comment: PreservedComment,
    splitOriginalText: string[],
): string {
    const startLineIndex = comment.loc.start.line - 1;
    const endLineIndex = comment.loc.end.line - 1;
    const startLine = splitOriginalText[startLineIndex];
    const endLine = splitOriginalText[endLineIndex];

    if (startLine == undefined || endLine == undefined) {
        return '';
    } else if (startLineIndex === endLineIndex) {
        return startLine.slice(comment.loc.start.column, comment.loc.end.column);
    } else {
        return [
            startLine.slice(comment.loc.start.column),
            ...splitOriginalText.slice(startLineIndex + 1, endLineIndex),
            endLine.slice(0, comment.loc.end.column),
        ].join('\n');
    }
}

function getMissingPreservedCommentDocs(
    lineNumber: number,
    commentTriggers: CommentTriggers,
    splitOriginalText: string[],
): Doc[] {
    /**
     * The oxc wrapper replaces plugin-owned trigger comments with whitespace before parse. Re-emit
     * those comments here, but skip comments that are still present in parser-owned source text so
     * Babel/TypeScript paths do not duplicate them.
     */
    const missingCommentDocs = (commentTriggers.preservedComments[lineNumber] ?? []).flatMap(
        (comment): Doc[] => {
            const sourceTextAtCommentLocation = getSourceTextAtCommentLocation(
                comment,
                splitOriginalText,
            );

            if (sourceTextAtCommentLocation.trim()) {
                return [];
            }

            return [
                formatPreservedComment(comment),
                doc.builders.hardline,
            ];
        },
    );

    return missingCommentDocs;
}

function hasSameLineAncestor(path: AstPath, currentNode: unknown, lineNumber: number): boolean {
    return path.ancestors.some((ancestor): boolean => {
        if (ancestor === currentNode) {
            return false;
        }

        const ancestorStartLine = (ancestor as Partial<Node> | undefined)?.loc?.start.line;

        return ancestorStartLine === lineNumber;
    });
}

export function getPreservedCommentDocsForNode(
    path: AstPath,
    node: unknown,
    lineNumber: number,
    commentTriggers: CommentTriggers,
    splitOriginalText: string[],
): Doc[] {
    if (hasSameLineAncestor(path, node, lineNumber + 1)) {
        return [];
    }

    return getMissingPreservedCommentDocs(lineNumber, commentTriggers, splitOriginalText);
}

export function prependDocs(docsToPrepend: Doc[], docToAppend: Doc): Doc {
    if (docsToPrepend.length) {
        return [
            ...docsToPrepend,
            docToAppend,
        ];
    } else {
        return docToAppend;
    }
}
