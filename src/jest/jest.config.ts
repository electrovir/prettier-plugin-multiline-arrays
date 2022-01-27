import {join} from 'path';
import {InitialOptionsTsJest} from 'ts-jest';

const config: InitialOptionsTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: false,

    /** Can't import from the common package to use repoDir so we have to redefine the path manually here */
    rootDir: process.cwd(),
    silent: false,
    roots: [join(process.cwd(), 'src')],
    setupFilesAfterEnv: [join(__dirname, 'jest.setup.ts')],
    globals: {
        'ts-jest': {
            tsconfig: join(process.cwd(), 'tsconfig.json'),
            diagnostics: {
                warnOnly: true,
                ignoreCodes: ['TS151001'],
            },
        },
    },
};

export default config;
