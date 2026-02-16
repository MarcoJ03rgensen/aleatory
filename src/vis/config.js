/**
 * @module vis/config
 * @description Configuration and customization options for visualizations
 */

/**
 * Default plot configuration
 */
export const DEFAULT_CONFIG = {
  // Layout
  width: 800,
  height: 600,
  margin: { l: 80, r: 50, t: 80, b: 80 },
  
  // Colors
  colors: {
    primary: '#2E86AB',
    secondary: '#A23B72',
    tertiary: '#F18F01',
    quaternary: '#C73E1D',
    background: '#FFFFFF',
    grid: '#E5E5E5',
    text: '#2D2D2D'
  },
  
  // Typography
  fonts: {
    title: { family: 'Arial, sans-serif', size: 18, weight: 'bold' },
    axis: { family: 'Arial, sans-serif', size: 14 },
    tick: { family: 'Arial, sans-serif', size: 12 },
    legend: { family: 'Arial, sans-serif', size: 12 }
  },
  
  // Styling
  lineWidth: 2,
  markerSize: 6,
  opacity: 0.7,
  
  // Statistics
  bins: 30,
  bandwidth: 'auto', // KDE bandwidth
  confidenceLevel: 0.95,
  
  // Interaction
  interactive: true,
  showLegend: true,
  showGrid: true,
  
  // Export
  exportFormat: 'svg',
  dpi: 300
};

/**
 * Plot configuration class
 */
export class PlotConfig {
  constructor(options = {}) {
    // Deep merge with defaults
    this.width = options.width || DEFAULT_CONFIG.width;
    this.height = options.height || DEFAULT_CONFIG.height;
    this.margin = { ...DEFAULT_CONFIG.margin, ...options.margin };
    this.colors = { ...DEFAULT_CONFIG.colors, ...options.colors };
    this.fonts = {
      title: { ...DEFAULT_CONFIG.fonts.title, ...options.fonts?.title },
      axis: { ...DEFAULT_CONFIG.fonts.axis, ...options.fonts?.axis },
      tick: { ...DEFAULT_CONFIG.fonts.tick, ...options.fonts?.tick },
      legend: { ...DEFAULT_CONFIG.fonts.legend, ...options.fonts?.legend }
    };
    this.lineWidth = options.lineWidth || DEFAULT_CONFIG.lineWidth;
    this.markerSize = options.markerSize || DEFAULT_CONFIG.markerSize;
    this.opacity = options.opacity || DEFAULT_CONFIG.opacity;
    this.bins = options.bins || DEFAULT_CONFIG.bins;
    this.bandwidth = options.bandwidth || DEFAULT_CONFIG.bandwidth;
    this.confidenceLevel = options.confidenceLevel || DEFAULT_CONFIG.confidenceLevel;
    this.interactive = options.interactive !== undefined ? options.interactive : DEFAULT_CONFIG.interactive;
    this.showLegend = options.showLegend !== undefined ? options.showLegend : DEFAULT_CONFIG.showLegend;
    this.showGrid = options.showGrid !== undefined ? options.showGrid : DEFAULT_CONFIG.showGrid;
    this.exportFormat = options.exportFormat || DEFAULT_CONFIG.exportFormat;
    this.dpi = options.dpi || DEFAULT_CONFIG.dpi;
    
    // Custom overrides
    this.custom = options.custom || {};
  }
  
  /**
   * Generate Plotly layout from config
   */
  toPlotlyLayout(title = '', xaxis = {}, yaxis = {}) {
    return {
      title: {
        text: title,
        font: this.fonts.title,
        x: 0.5,
        xanchor: 'center'
      },
      width: this.width,
      height: this.height,
      margin: this.margin,
      paper_bgcolor: this.colors.background,
      plot_bgcolor: this.colors.background,
      showlegend: this.showLegend,
      xaxis: {
        title: { text: xaxis.title || '', font: this.fonts.axis },
        tickfont: this.fonts.tick,
        gridcolor: this.showGrid ? this.colors.grid : 'rgba(0,0,0,0)',
        showgrid: this.showGrid,
        zeroline: true,
        zerolinecolor: this.colors.grid,
        ...xaxis
      },
      yaxis: {
        title: { text: yaxis.title || '', font: this.fonts.axis },
        tickfont: this.fonts.tick,
        gridcolor: this.showGrid ? this.colors.grid : 'rgba(0,0,0,0)',
        showgrid: this.showGrid,
        zeroline: true,
        zerolinecolor: this.colors.grid,
        ...yaxis
      },
      hovermode: this.interactive ? 'closest' : false,
      ...this.custom
    };
  }
}
