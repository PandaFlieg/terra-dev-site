const startCase = require('lodash.startcase');
const ImportAggregator = require('./generation-objects/ImportAggregator');

/**
* Generates the file representing app name configuration.
*/
const generateNameConfig = (appConfig) => {
  const imports = new ImportAggregator();
  const config = {
    title: startCase(appConfig.title),
  };

  return { config, imports };
};

module.exports = generateNameConfig;
