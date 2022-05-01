import {runTests} from './run-tests';
import {typescriptTests} from './typescript-tests';

describe('typescript multiline array formatting', () => {
    runTests('.ts', typescriptTests);
});
