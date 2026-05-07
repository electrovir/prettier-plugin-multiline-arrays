import {type Comment} from 'estree';
import {isTriggerCommentText} from '../printer/comment-triggers.js';
import {createLocationFinder} from './oxc-locations.js';

function addRangeToComment<T extends Comment>(comment: T, start: number, end: number): T {
    return Object.assign(comment, {
        end,
        range: [
            start,
            end,
        ],
        start,
    });
}

/**
 * `@prettier/plugin-oxc@0.1.4` can crash while attaching line comments in call arguments
 * (`isChildWontPrint` / `canAttachComment`). The printer wrapper guards that hook; this scan keeps
 * trigger metadata independent from oxc's comment attachment.
 *
 * This is deliberately not a general comment parser: ordinary comments are left to oxc, and so
 * upstream fixes naturally take effect.
 */
export function collectOxcTriggerComments(text: string): Comment[] {
    const comments: Comment[] = [];
    const getLocation = createLocationFinder(text);

    function skipQuotedString(characterIndex: number, quoteCharacter: string): number {
        characterIndex++;

        while (characterIndex < text.length) {
            const stringCharacter = text[characterIndex];

            if (stringCharacter === '\\') {
                characterIndex += 2;
            } else if (stringCharacter === quoteCharacter) {
                characterIndex++;
                break;
            } else {
                characterIndex++;
            }
        }

        return characterIndex;
    }

    function scanLineComment(characterIndex: number): number {
        const commentStart = characterIndex;
        const commentTextStart = characterIndex + 2;
        characterIndex = commentTextStart;

        while (
            characterIndex < text.length &&
            text[characterIndex] !== '\n' &&
            text[characterIndex] !== '\r'
        ) {
            characterIndex++;
        }

        const commentText = text.slice(commentTextStart, characterIndex);
        if (isTriggerCommentText(commentText)) {
            comments.push(
                addRangeToComment(
                    {
                        loc: {
                            end: getLocation(characterIndex),
                            start: getLocation(commentStart),
                        },
                        type: 'Line',
                        value: commentText,
                    },
                    commentStart,
                    characterIndex,
                ),
            );
        }

        return characterIndex;
    }

    function scanBlockComment(characterIndex: number): number {
        const commentStart = characterIndex;
        const commentTextStart = characterIndex + 2;
        const commentTextEnd = text.indexOf('*/', commentTextStart);
        const commentEnd = commentTextEnd < 0 ? text.length : commentTextEnd + 2;
        const commentText = text.slice(
            commentTextStart,
            commentTextEnd < 0 ? text.length : commentTextEnd,
        );

        if (isTriggerCommentText(commentText)) {
            comments.push(
                addRangeToComment(
                    {
                        loc: {
                            end: getLocation(commentEnd),
                            start: getLocation(commentStart),
                        },
                        type: 'Block',
                        value: commentText,
                    },
                    commentStart,
                    commentEnd,
                ),
            );
        }

        return commentEnd;
    }

    function scanTemplateLiteral(characterIndex: number): number {
        characterIndex++;

        while (characterIndex < text.length) {
            const currentCharacter = text[characterIndex];
            const nextCharacter = text[characterIndex + 1];

            if (currentCharacter === '\\') {
                characterIndex += 2;
            } else if (currentCharacter === '`') {
                return characterIndex + 1;
            } else if (currentCharacter === '$' && nextCharacter === '{') {
                characterIndex = scanJavaScript(characterIndex + 2, true);
            } else {
                characterIndex++;
            }
        }

        return characterIndex;
    }

    function scanJavaScript(characterIndex: number, stopAtTemplateExpressionEnd: boolean): number {
        let braceDepth = 0;

        while (characterIndex < text.length) {
            const currentCharacter = text[characterIndex];
            const nextCharacter = text[characterIndex + 1];

            if (currentCharacter === '"' || currentCharacter === "'") {
                characterIndex = skipQuotedString(characterIndex, currentCharacter);
            } else if (currentCharacter === '`') {
                characterIndex = scanTemplateLiteral(characterIndex);
            } else if (currentCharacter === '/' && nextCharacter === '/') {
                characterIndex = scanLineComment(characterIndex);
            } else if (currentCharacter === '/' && nextCharacter === '*') {
                characterIndex = scanBlockComment(characterIndex);
            } else if (stopAtTemplateExpressionEnd && currentCharacter === '{') {
                braceDepth++;
                characterIndex++;
            } else if (stopAtTemplateExpressionEnd && currentCharacter === '}') {
                if (braceDepth) {
                    braceDepth--;
                    characterIndex++;
                } else {
                    return characterIndex + 1;
                }
            } else {
                characterIndex++;
            }
        }

        return characterIndex;
    }

    scanJavaScript(0, false);

    return comments;
}
