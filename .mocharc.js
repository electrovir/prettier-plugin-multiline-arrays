const baseOptions = require('./.virmator/mocharc-base');

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    ...baseOptions,
    // uncomment this when you need to force a single test, as that isn't supported in parallel mode
    // parallel: false,
};

module.exports = mochaConfig;
