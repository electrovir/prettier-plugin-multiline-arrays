import {Options} from 'prettier';
// ignore this import cause it's not typed. We're typing it inside of here!
// @ts-expect-error
import * as importedRepoConfig from '../../.prettierrc.js';

export const repoConfig: Options = importedRepoConfig as Options;
