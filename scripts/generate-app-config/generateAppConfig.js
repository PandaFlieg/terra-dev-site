const fse = require('fs-extra');
const path = require('path');
const writeConfig = require('./writeConfig');
const generateContentConfig = require('./generateContentConfig');
const generateNameConfig = require('./generateNameConfig');
const generateSettingsConfig = require('./generateSettingsConfig');
const generateNavigationItems = require('./generateNavigationItems');
const generatePagesConfig = require('./generatePagesConfig');
const generateSearchItems = require('./generateSearchItems');
const generateExtensionConfig = require('./generateExtensionConfig');
const injectLink = require('./injectLink');
const ImportAggregator = require('./generation-objects/ImportAggregator');
const importSideEffects = require('./importSideEffects');

/**
* Writes out a file consisting of the config and imports with the given file name to the specified path.
* Returns an object representing an imported variable.
*/
const addConfig = (config, fileName, buildPath, fs, imports) => {
  if (config) {
    writeConfig(config, fileName, buildPath, fse);
    const { name } = path.parse(fileName);
    return imports.addImport(`./${name}`, name);
  }
  return undefined;
};

/**
* Writes out a file consisting of the app config and imports with the given file name to the specified path.
*/
const generateAppConfig = (siteConfig, production, verbose, locale) => {
  const imports = new ImportAggregator();

  const {
    appConfig,
    navConfig,
    sideEffectImports,
    placeholderSrc,
  } = siteConfig;

  const rootPath = path.join(process.cwd(), 'dev-site-config');
  // This is where we are writing out the generated files.
  const buildPath = path.join(rootPath, 'build');

  if (siteConfig.includeTestEvidence) {
    navConfig.navigation.links = injectLink(navConfig, {
      path: '/evidence',
      text: 'Evidence',
      pageTypes: ['evidence'],
    });
  }

  const settingsConfig = addConfig(
    generateSettingsConfig(appConfig, locale),
    'settingsConfig.js',
    buildPath,
    fse,
    imports,
  );

  const nameConfig = addConfig(
    generateNameConfig(appConfig),
    'nameConfig.js',
    buildPath,
    fse,
    imports,
  );

  const { menuItems, content } = generateContentConfig(siteConfig, generatePagesConfig(siteConfig, production, verbose));
  const menuConfigImport = addConfig(
    menuItems,
    'menuItems.js',
    buildPath,
    fse,
    imports,
  );
  const contentConfigImport = addConfig(
    content,
    'contentConfig.js',
    buildPath,
    fse,
    imports,
  );

  const { navigationItems, capabilities } = generateNavigationItems(navConfig);
  const navigationItemsImport = addConfig(
    navigationItems,
    'navigationItems.js',
    buildPath,
    fse,
    imports,
  );

  const extensionConfigImport = addConfig(
    generateExtensionConfig(appConfig.extensions),
    'extensionsConfig.js',
    buildPath,
    fse,
    imports,
  );

  // Create search items file
  writeConfig(
    generateSearchItems(content),
    'searchItems.js',
    buildPath,
    fse,
  );

  // Add any side-effect imports.
  importSideEffects(sideEffectImports, imports);

  // Building out the overall config import.
  const config = {
    nameConfig,
    settingsConfig,
    menuItems: menuConfigImport,
    contentConfig: contentConfigImport,
    navigationItems: navigationItemsImport,
    indexPath: navConfig.navigation.index,
    capabilities,
    extensions: extensionConfigImport,
    placeholderSrc: imports.addImport(placeholderSrc, 'placeholderSrc'),
  };

  writeConfig({ config, imports }, 'siteConfig.js', buildPath, fse);
};

module.exports = generateAppConfig;
