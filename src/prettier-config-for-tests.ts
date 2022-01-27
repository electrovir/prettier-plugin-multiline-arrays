import {Options} from 'prettier';
// @ts-ignore
import * as importedRepoConfig from '../.prettierrc.js';

export const repoConfig: Options = importedRepoConfig as Options;
