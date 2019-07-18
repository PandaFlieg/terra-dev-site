import React from 'react';
import PropTypes from 'prop-types';

import MenuButton from '../menu-button/_MenuButton';

const propTypes = {
  selectedTheme: PropTypes.string,
  selectedLocale: PropTypes.string,
  config: PropTypes.shape({
    themes: PropTypes.arrayOf(PropTypes.string),
    selectedTheme: PropTypes.string,
    locales: PropTypes.arrayOf(PropTypes.string),
    selectedLocale: PropTypes.string,
    directions: PropTypes.arrayOf(PropTypes.string),
    selectedDirection: PropTypes.string,
  }),
  onChangeLocale: PropTypes.func,
  onChangeTheme: PropTypes.func,
};

const defaultProps = {
  selectedTheme: undefined,
  selectedLocale: undefined,
  config: undefined,
  onChangeLocale: undefined,
  onChangeTheme: undefined,
};

const ComponentToolbarMenu = ({
  config,
  selectedTheme,
  selectedLocale,
  onChangeTheme,
  onChangeLocale,
}) => {
  const hasThemes = config.themes.length > 1;
  const hasLocales = config.locales.length > 1;

  if (!hasThemes && !hasLocales) {
    return null;
  }

  return (
    <>
      {hasThemes
        && <MenuButton text="Theme" items={config.themes} selectedKey={selectedTheme} onChange={onChangeTheme} />
      }
      {hasLocales
        && <MenuButton text="Locale" items={config.locales} selectedKey={selectedLocale} onChange={onChangeLocale} />
      }
    </>
  );
};

ComponentToolbarMenu.propTypes = propTypes;
ComponentToolbarMenu.defaultProps = defaultProps;

export default ComponentToolbarMenu;