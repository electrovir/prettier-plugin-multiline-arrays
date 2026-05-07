import {type Comment} from 'estree';

const ignoreTheseKeys = ['tokens'];
const ignoreTheseChildTypes = [
    'string',
    'number',
];

const commentTypes = [
    'Line',
    'Block',
    'CommentBlock',
    'CommentLine',
] as const;

function isMaybeComment(input: any): input is Comment {
    return !(
        !input ||
        typeof input !== 'object' ||
        !('type' in input) ||
        !commentTypes.includes(input.type) ||
        !('value' in input)
    );
}

export function extractComments(node: any): Comment[] {
    if (!node || typeof node !== 'object') {
        return [];
    } else if (Array.isArray(node.comments)) {
        return dedupeComments(node.comments.filter(isMaybeComment));
    }

    const comments: Comment[] = [];

    if (Array.isArray(node)) {
        comments.push(...node.filter(isMaybeComment));
    }

    Object.keys(node).forEach((nodeKey) => {
        if (!ignoreTheseKeys.includes(nodeKey)) {
            const nodeChild = node[nodeKey];
            if (!ignoreTheseChildTypes.includes(typeof nodeChild)) {
                comments.push(...extractComments(nodeChild));
            }
        }
    });

    return dedupeComments(comments);
}

function dedupeComments(comments: Comment[]): Comment[] {
    const seenComments = new Set<string>();

    return comments.filter((comment) => {
        const key = [
            comment.type,
            comment.value,
            comment.loc?.start.line,
            comment.loc?.start.column,
            comment.loc?.end.line,
            comment.loc?.end.column,
        ].join(':');

        if (seenComments.has(key)) {
            return false;
        }

        seenComments.add(key);
        return true;
    });
}
