import {runTests} from './run-tests';
import {typescriptTests} from './typescript.test';

describe('babel-ts multiline array formatting', () => {
    runTests('.ts', typescriptTests, 'babel-ts');
});
