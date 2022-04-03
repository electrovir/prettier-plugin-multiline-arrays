import {ArrayExpression, ArrayPattern, Node} from 'estree';

export type ArrayLikeNode = ArrayExpression | ArrayPattern;

export function isArrayLikeNode(node: Node): node is ArrayLikeNode {
    return (
        node.type === 'ArrayExpression' ||
        node.type === 'ArrayPattern' ||
        (node.type as any) === 'TupleExpression'
    );
}
