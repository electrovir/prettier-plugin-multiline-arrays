import {Comment} from 'estree';

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
    if (!input || typeof input !== 'object') {
        return false;
    }
    if (!('type' in input)) {
        return false;
    }
    if (!commentTypes.includes(input.type)) {
        return false;
    }
    if (!('value' in input)) {
        return false;
    }

    return true;
}

export function extractComments(node: any): Comment[] {
    if (!node || typeof node !== 'object') {
        return [];
    }
    let comments: Comment[] = [];

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

    // this might duplicate comments but our later code doesn't care
    return comments;
}
