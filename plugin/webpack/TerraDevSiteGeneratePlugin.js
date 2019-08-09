const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

const generateAppConfig = require('../../scripts/generate-app-config/generateAppConfig');
const getNewRelicJS = require('../../scripts/new-relic/getNewRelicJS');

const indexPlugin = ({
  filename, lang, siteConfig, siteEntries, entry,
}) => {
  const otherSiteEntries = siteEntries.filter(indexEntry => indexEntry !== entry);
  return new HtmlWebpackPlugin({
    title: siteConfig.appConfig.title,
    filename,
    template: path.join(__dirname, '..', '..', 'lib', 'index.html'),
    lang,
    rootElementId: 'root',
    dir: siteConfig.appConfig.defaultDirection,
    favicon: siteConfig.appConfig.favicon,
    headHtml: [getNewRelicJS()].concat(siteConfig.appConfig.headHtml),
    headChunks: ['rewriteHistory'],
    excludeChunks: ['redirect', ...otherSiteEntries],
    inject: false, // This turns off auto injection. We handle this ourselves in the template.
  });
};

const prefixEntry = site => (site.prefix ? `${site.prefix}/${site.entry}` : site.entry);

class TerraDevSitePlugin {
  constructor({ sites, lang, basename } = {}) {
    this.sites = sites;
    this.entries = sites.map(site => prefixEntry(site));
    this.lang = lang;
    this.basename = basename;
  }

  apply(compiler) {
    // Load the site configuration.
    const production = compiler.options.mode === 'production';

    this.sites.forEach((site) => {
      // GENERATE
      // Generate the files need to spin up the site.
      generateAppConfig(site.siteConfig, production, site.prefix);

      let filename = 'index.html';
      let { basename } = this;

      if (site.prefix) {
        filename = `${site.prefix}/index.html`;
        basename = `${this.basename}/${site.prefix}`;
      }

      new webpack.DefinePlugin({
        // Base name is used to namespace terra-dev-site
        [site.basenameDefine]: JSON.stringify(basename),
      }).apply(compiler);

      // indexes
      const indexEntryPoints = [];
      indexEntryPoints.push('terra-dev-site');
      // terra-dev-site index.html
      indexPlugin({
        filename,
        lang: this.lang,
        siteConfig: site.siteConfig,
        siteEntries: this.entries,
        entry: prefixEntry(site),
      }).apply(compiler);
    });
  }
}

module.exports = TerraDevSitePlugin;