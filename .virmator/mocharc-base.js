const allTestFiles = 'src/**/!(*.type).test.ts?(x)';
const isTestingOtherFiles = process.argv.some((arg) => arg.match(/\.tsx?$/));

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    checkLeaks: true,
    color: true,
    parallel: true,
    require: 'ts-node/register',
    slow: '1500', // ms
    timeout: '60000', // ms
    ...(isTestingOtherFiles ? {} : {spec: allTestFiles}),
};

module.exports = mochaConfig;
