import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { withActiveBreakpoint } from 'terra-application/lib/breakpoints';
import Overlay from 'terra-overlay';
import FocusTrap from 'focus-trap-react';
import ContentContainer from 'terra-content-container';

import ComponentToolbar from './_ComponentToolbar';
import CollapsingNavigationMenu from './_CollapsingNavigationMenu';

import styles from './SecondaryNavigationLayout.module.scss';

const cx = classNames.bind(styles);

const isCompactLayout = activeBreakpoint => activeBreakpoint === 'tiny' || activeBreakpoint === 'small';

const propTypes = {
  menuItems: PropTypes.PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string,
    path: PropTypes.string,
  })).isRequired,
  selectedMenuItemKey: PropTypes.string,
  onTerminalMenuItemSelection: PropTypes.func.isRequired,
  /**
   * The element to display in the main content area.
   */
  children: PropTypes.element.isRequired,

  devToolbarConfig: PropTypes.shape({
    selectedTheme: PropTypes.string,
    selectedLocale: PropTypes.string,
    themes: PropTypes.arrayOf(PropTypes.string),
    locales: PropTypes.arrayOf(PropTypes.string),
    onChangeLocale: PropTypes.func,
    onChangeTheme: PropTypes.func,
  }),
  /**
   * @private
   */
  activeBreakpoint: PropTypes.string.isRequired,
};

const defaultProps = {
  selectedMenuItemKey: undefined,
};

class SecondaryNavigationLayout extends React.Component {
  static buildAncestorMap(menuItems) {
    const ancestorMap = {};
    menuItems.forEach((item) => {
      ancestorMap[item.key] = SecondaryNavigationLayout.findAncestor(item.key, menuItems);
    });

    return ancestorMap;
  }

  static findAncestor(key, menuItems) {
    for (let i = 0, numberOfItems = menuItems.length; i < numberOfItems; i += 1) {
      const item = menuItems[i];
      if (item.childKeys && item.childKeys.indexOf(key) >= 0) {
        return item;
      }
    }
    return undefined;
  }

  static buildSelectionPath(key, ancestorMap) {
    if (ancestorMap[key]) {
      return [...SecondaryNavigationLayout.buildSelectionPath(ancestorMap[key].key, ancestorMap)].concat([key]);
    }

    return [key];
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (state.previousActiveBreakpoint !== props.activeBreakpoint) {
      newState.previousActiveBreakpoint = props.activeBreakpoint;
    }

    if (!isCompactLayout(props.activeBreakpoint) && state.compactMenuIsOpen) {
      /**
       * The compact menu state is reset when a non-compact breakpoint is active.
       */
      newState.compactMenuIsOpen = false;
    }

    return newState;
  }

  static flattenMenuItems(menuItems) {
    return menuItems.reduce((accumulatedMenuItems, item) => {
      let generatedMenuItems = [{
        text: item.text,
        key: item.path,
        hasSubMenu: item.hasSubMenu,
        childKeys: item.childItems && item.childItems.map(childItem => childItem.path),
        metaData: !item.hasSubMenu ? {
          path: item.path,
        } : undefined,
      }];

      if (item.childItems) {
        generatedMenuItems = generatedMenuItems.concat(SecondaryNavigationLayout.flattenMenuItems(item.childItems));
      }

      return accumulatedMenuItems.concat(generatedMenuItems);
    }, []);
  }

  constructor(props) {
    super(props);

    this.closeMenu = this.closeMenu.bind(this);
    this.openMenu = this.openMenu.bind(this);
    this.handleCollapsingMenuSelection = this.handleCollapsingMenuSelection.bind(this);

    const flattenedMenuItems = SecondaryNavigationLayout.flattenMenuItems(props.menuItems);

    this.ancestorMap = SecondaryNavigationLayout.buildAncestorMap(flattenedMenuItems);

    this.state = {
      flattenedMenuItems,
      previousActiveBreakpoint: props.activeBreakpoint,
      compactMenuIsOpen: false,
      menuIsPinnedOpen: true,
    };
  }

  closeMenu() {
    const { activeBreakpoint } = this.props;

    const isCompact = isCompactLayout(activeBreakpoint);

    if (isCompact) {
      this.setState({
        compactMenuIsOpen: false,
      });
    } else {
      this.setState({
        menuIsPinnedOpen: false,
      });
    }
  }

  openMenu() {
    const { activeBreakpoint } = this.props;

    const isCompact = isCompactLayout(activeBreakpoint);

    if (isCompact) {
      this.setState({
        compactMenuIsOpen: true,
      });
    } else {
      this.setState({
        menuIsPinnedOpen: true,
      });
    }
  }

  handleCollapsingMenuSelection(selectionKey) {
    const { onTerminalMenuItemSelection } = this.props;
    const { flattenedMenuItems } = this.state;

    const selectedItem = flattenedMenuItems.find(item => item.key === selectionKey);

    this.setState({
      // selectedChildKey: selectionKey,
      compactMenuIsOpen: false,
    }, () => {
      // If an endpoint has been reached, reset selection path and update.
      if (onTerminalMenuItemSelection) {
        onTerminalMenuItemSelection(selectionKey, selectedItem.metaData);
      }
    });
  }

  render() {
    const {
      children,
      menuItems,
      activeBreakpoint,
      devToolbarConfig,
      selectedMenuItemKey,
    } = this.props;

    const {
      compactMenuIsOpen,
      menuIsPinnedOpen,
      // selectedChildKey,
    } = this.state;

    const isCompact = isCompactLayout(activeBreakpoint);
    const menuIsVisible = isCompact ? compactMenuIsOpen : menuIsPinnedOpen;
    /**
     * At within compact viewports, the navigation menu should render each menu item as if it has
     * a submenu, as selecting a childless item will cause the menu close.
     */
    const menu = (
      <FocusTrap
        active={isCompact ? compactMenuIsOpen : false}
        focusTrapOptions={{
          escapeDeactivates: true,
          clickOutsideDeactivates: true,
          returnFocusOnDeactivate: true,
          onDeactivate: () => {
            this.setState({
              compactMenuIsOpen: false,
            });
          },
        }}
        className={cx('focus-trap-container')}
      >
        <CollapsingNavigationMenu
          menuItems={menuItems}
          selectedPath={selectedMenuItemKey}
          onSelect={this.handleCollapsingMenuSelection}
        />
      </FocusTrap>
    );

    let onToggle;
    if (isCompact) {
      onToggle = compactMenuIsOpen ? this.closeMenu : this.openMenu;
    } else {
      onToggle = menuIsPinnedOpen ? this.closeMenu : this.openMenu;
    }

    return (
      <div className={cx(['container', { 'panel-is-open': menuIsVisible }])}>
        <div className={cx('panel')}>
          {menu}
        </div>
        <div className={cx('content')}>
          <ContentContainer
            header={(
              <ComponentToolbar
                menuIsVisible={menuIsVisible}
                onToggle={onToggle}
                devToolbarConfig={devToolbarConfig}
              />
            )}
            fill
          >
            {children}
          </ContentContainer>
          <Overlay isOpen={isCompact ? compactMenuIsOpen : false} isRelativeToContainer className={cx('overlay')} />
        </div>
      </div>
    );
  }
}

SecondaryNavigationLayout.propTypes = propTypes;
SecondaryNavigationLayout.defaultProps = defaultProps;

export default withActiveBreakpoint(SecondaryNavigationLayout);
export {
  isCompactLayout,
};