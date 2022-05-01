import {runTests} from './run-tests';
import {typescriptTests} from './typescript-tests';

describe('babel-ts multiline array formatting', () => {
    runTests('.ts', typescriptTests, 'babel-ts');
});
