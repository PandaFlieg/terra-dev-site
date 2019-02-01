import React from 'react';
import PropTypes from 'prop-types';
import {
  withRouter, Switch, Route, matchPath, Redirect,
} from 'react-router-dom';

import { ActiveBreakpointContext } from 'terra-breakpoints';
import ApplicationLayout from 'terra-framework/packages/terra-application-layout/lib/ApplicationLayout';

import AppBase from './AppBase';
import AppContent from './AppContent';
import ConfigureUtilities from './ConfigureUtilities';
import NotFoundPage from './common/NotFoundPage';

const propTypes = {
  /**
   * The title branding of the site.
   */
  nameConfig: PropTypes.shape({
    accessory: PropTypes.element,
    title: PropTypes.string,
  }),
  /**
   * Configuration to setup the utilities menu.
   */
  utilityConfig: PropTypes.shape({
    title: PropTypes.string,
    accessory: PropTypes.element,
    onChange: PropTypes.func.isRequired,
    menuItems: PropTypes.object.isRequired,
    initialSelectedKey: PropTypes.string.isRequired,
  }),
  /**
  * The configuration Object that will be used to generate the specified regions of the terra-navigation-layout.
  * Note: The config prop is treated as an immutable object to prevent unnecessary processing and improve performance.
  * If the configuration is changed after the first render, a new configuration object instance must be provided.
  */
  // eslint-disable-next-line react/forbid-prop-types
  routingConfig: PropTypes.object.isRequired,
  /**
   * The navigaion links to display within the menu in the toolbar.
   */
  // eslint-disable-next-line react/forbid-prop-types
  navigationItems: PropTypes.array,
  /**
   * React object to display in the utilities area in the application layout.
   */
  extensions: PropTypes.element,
  /**
   * The path to the sites index.
   */
  indexPath: PropTypes.string.isRequired,
  /**
   * The theme the site should default to.
   */
  defaultTheme: PropTypes.string,
  /**
   * The themes the site could use.
   */
  // eslint-disable-next-line react/forbid-prop-types
  themes: PropTypes.object,
  /**
   * Injected by react-router: represent where the app is now, where you want it to go,
   * or even where it was.
   */
  location: PropTypes.shape({
    pathname: PropTypes.string,
  }),
  /**
   * Injected by react-router: the object representing browser history.
   */
  // eslint-disable-next-line react/forbid-prop-types
  history: PropTypes.object,
};

const defaultProps = {
  nameConfig: undefined,
  defaultTheme: undefined,
  themes: undefined,
  navigationItems: undefined,
  extensions: undefined,
  utilityConfig: undefined,
  location: undefined,
  history: undefined,
};

class App extends React.Component {
  static propExistsAndChanged(nextProp, currentProp) {
    return nextProp !== undefined && nextProp !== currentProp;
  }

  static getActiveNavigationItemPath(location, navigationItems) {
    for (let i = 0, numberOfNavigationItems = navigationItems.length; i < numberOfNavigationItems; i += 1) {
      if (matchPath(location.pathname, navigationItems[i].path)) {
        return navigationItems[i].path;
      }
    }

    return undefined;
  }

  static getDerivedStateFromProps(newProps) {
    return {
      activeNavigationItemPath: App.getActiveNavigationItemPath(newProps.location, newProps.navigationItems),
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      dir: document.getElementsByTagName('html')[0].getAttribute('dir'),
      locale: document.getElementsByTagName('html')[0].getAttribute('lang'),
      theme: props.defaultTheme,
      activeNavigationItem: undefined,
    };

    this.handleBidiChange = this.handleBidiChange.bind(this);
    this.handleThemeChange = this.handleThemeChange.bind(this);
    this.handleLocaleChange = this.handleLocaleChange.bind(this);
    this.handleNavigationItemSelection = this.handleNavigationItemSelection.bind(this);

    this.utilityConfig = this.setupUtilityConfig(props.utilityConfig);
  }

  setupUtilityConfig(utilityConfig) {
    return ConfigureUtilities.addCallbackFunctions(
      utilityConfig,
      {
        Theme: { onChange: this.handleThemeChange },
        Locale: { onChange: this.handleLocaleChange },
        Bidi: { onChange: this.handleBidiChange },
      },
    );
  }

  handleBidiChange(key) {
    document.getElementsByTagName('html')[0].setAttribute('dir', key);
    this.setState({ dir: key });
  }

  handleLocaleChange(key) {
    document.getElementsByTagName('html')[0].setAttribute('lang', key);
    this.setState({ locale: key });
  }

  handleThemeChange(key) {
    this.setState({ theme: key });
  }


  handleNavigationItemSelection(navigationItemKey) {
    const { history } = this.props;
    const { activeNavigationItemPath } = this.state;

    if (activeNavigationItemPath !== navigationItemKey) {
      history.push(navigationItemKey);
    }
  }

  render() {
    const {
      nameConfig, routingConfig, navigationItems, indexPath, extensions, themes, location,
    } = this.props;
    const {
      theme, locale, dir, activeNavigationItemPath,
    } = this.state;
    this.utilityConfig = ConfigureUtilities.updateSelectedItems(this.utilityConfig, theme, locale, dir);

    if (!activeNavigationItemPath) {
      if (location.pathname === '/') {
        return <Redirect to={indexPath} />;
      }

      if (location.pathname !== '/404') {
        return <Redirect to="/404" />;
      }
    }

    return (
      <AppBase locale={locale} themeName={themes[theme]}>
        <Switch
          key={activeNavigationItemPath}
        >
          <Route
            path="/raw"
            render={() => {
              const flattenedRouteConfig = Object.keys(routingConfig.content).reduce((allRoutes, pageKey) => Object.assign(allRoutes, routingConfig.content[pageKey]), {});

              const routes = Object.keys(flattenedRouteConfig).sort().reverse();
              const nonRawPath = location.pathname.substring(4);

              const route = routes.find(routeToMatch => matchPath(nonRawPath, routeToMatch));

              if (route) {
                const routeData = flattenedRouteConfig[route].component.default;
                return React.createElement(routeData.componentClass, routeData.props);
              }

              return <Redirect to="/404" />;
            }}
          />
          <Route
            path="/404"
            render={() => (
              <NotFoundPage homePath={indexPath} />
            )}
          />
          <Route
            render={() => {
              const { activeNavigationItemPath: localActiveNavigationItemPath } = this.state;
              const pageMenuItems = routingConfig.menuItems[localActiveNavigationItemPath];
              const pageContent = routingConfig.content[localActiveNavigationItemPath];

              return (
                <ApplicationLayout
                  nameConfig={nameConfig}
                  navigationAlignment="start"
                  navigationItems={navigationItems.map(item => ({
                    key: item.path,
                    text: item.text,
                  }))}
                  activeNavigationItemKey={localActiveNavigationItemPath}
                  onSelectNavigationItem={this.handleNavigationItemSelection}
                  extensions={extensions}
                  utilityConfig={ConfigureUtilities.convertChildkeysToArray(this.utilityConfig)}
                >
                  <AppContent
                    menuItems={pageMenuItems}
                    contentConfig={pageContent}
                    rootPath={localActiveNavigationItemPath}
                    key={localActiveNavigationItemPath}
                  />
                </ApplicationLayout>
              );
            }}
          />
        </Switch>
      </AppBase>
    );
  }
}

App.propTypes = propTypes;
App.defaultProps = defaultProps;

export default withRouter(App);
