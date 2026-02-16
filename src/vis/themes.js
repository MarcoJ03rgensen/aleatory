/**
 * @module vis/themes
 * @description Pre-built themes for visualizations
 */

import { PlotConfig } from './config.js';

/**
 * Built-in themes
 */
export const THEMES = {
  // Default Aleatory theme
  default: {
    colors: {
      primary: '#2E86AB',
      secondary: '#A23B72',
      tertiary: '#F18F01',
      quaternary: '#C73E1D',
      background: '#FFFFFF',
      grid: '#E5E5E5',
      text: '#2D2D2D'
    }
  },
  
  // Dark theme
  dark: {
    colors: {
      primary: '#00D9FF',
      secondary: '#FF6B9D',
      tertiary: '#FFD93D',
      quaternary: '#FF5E5B',
      background: '#1E1E1E',
      grid: '#3D3D3D',
      text: '#E5E5E5'
    }
  },
  
  // Minimal theme
  minimal: {
    colors: {
      primary: '#000000',
      secondary: '#666666',
      tertiary: '#999999',
      quaternary: '#CCCCCC',
      background: '#FFFFFF',
      grid: '#F0F0F0',
      text: '#000000'
    },
    lineWidth: 1,
    markerSize: 4
  },
  
  // Colorblind-friendly theme (using ColorBrewer)
  colorblind: {
    colors: {
      primary: '#1b9e77',
      secondary: '#d95f02',
      tertiary: '#7570b3',
      quaternary: '#e7298a',
      background: '#FFFFFF',
      grid: '#E5E5E5',
      text: '#2D2D2D'
    }
  },
  
  // Publication theme (Nature-style)
  publication: {
    width: 600,
    height: 450,
    colors: {
      primary: '#0C5DA5',
      secondary: '#FF9500',
      tertiary: '#00B945',
      quaternary: '#FF2C00',
      background: '#FFFFFF',
      grid: '#D0D0D0',
      text: '#000000'
    },
    fonts: {
      title: { family: 'Arial, sans-serif', size: 12, weight: 'bold' },
      axis: { family: 'Arial, sans-serif', size: 10 },
      tick: { family: 'Arial, sans-serif', size: 9 },
      legend: { family: 'Arial, sans-serif', size: 9 }
    },
    lineWidth: 1.5,
    markerSize: 4,
    dpi: 600
  },
  
  // R ggplot2 theme
  ggplot2: {
    colors: {
      primary: '#F8766D',
      secondary: '#00BA38',
      tertiary: '#619CFF',
      quaternary: '#F564E3',
      background: '#EBEBEB',
      grid: '#FFFFFF',
      text: '#2D2D2D'
    },
    showGrid: true
  }
};

/**
 * Create a custom theme
 * @param {Object} options - Theme options (partial config)
 * @returns {PlotConfig} Theme configuration
 */
export function createTheme(options = {}) {
  return new PlotConfig(options);
}

/**
 * Apply a built-in theme
 * @param {string} themeName - Name of built-in theme
 * @param {Object} overrides - Additional options to override theme defaults
 * @returns {PlotConfig} Themed configuration
 */
export function applyTheme(themeName = 'default', overrides = {}) {
  const theme = THEMES[themeName];
  if (!theme) {
    throw new Error(`Unknown theme: ${themeName}. Available themes: ${Object.keys(THEMES).join(', ')}`);
  }
  return new PlotConfig({ ...theme, ...overrides });
}

/**
 * Get list of available themes
 * @returns {string[]} Array of theme names
 */
export function getThemes() {
  return Object.keys(THEMES);
}
