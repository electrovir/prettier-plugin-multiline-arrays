const {baseConfig} = require('virmator/base-configs/base-cspell.js');

module.exports = {
    ...baseConfig,
    ignorePaths: [...baseConfig.ignorePaths],
    words: [
        ...baseConfig.words,
        'farmerpaul',
        'Robinfr',
        'espree',
        'meriyah',
    ],
};
