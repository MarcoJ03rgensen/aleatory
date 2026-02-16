/**
 * @module vis
 * @description Visualization module for Aleatory statistical library
 * Provides beautiful, customizable charts for all statistical features
 */

import { createHistogram, createDensityPlot, createQQPlot, createDistributionPlot } from './plots/distribution.js';
import { createScatterPlot, createResidualsPlot, createFittedPlot, createLeveragePlot } from './plots/regression.js';
import { createBoxPlot, createViolinPlot, createBarPlot } from './plots/categorical.js';
import { createHeatmap, createCorrelationMatrix } from './plots/matrix.js';
import { createTheme, applyTheme } from './themes.js';
import { PlotConfig } from './config.js';

// Re-export all visualization functions
export {
  // Distribution plots
  createHistogram,
  createDensityPlot,
  createQQPlot,
  createDistributionPlot,
  
  // Regression plots
  createScatterPlot,
  createResidualsPlot,
  createFittedPlot,
  createLeveragePlot,
  
  // Categorical plots
  createBoxPlot,
  createViolinPlot,
  createBarPlot,
  
  // Matrix plots
  createHeatmap,
  createCorrelationMatrix,
  
  // Theming
  createTheme,
  applyTheme,
  PlotConfig
};

/**
 * Main visualization function - automatically selects appropriate plot type
 * @param {Object} data - Data object (Vector, DataFrame, model fit, etc.)
 * @param {Object} options - Visualization options
 * @returns {Object} Plotly figure specification
 */
export function visualize(data, options = {}) {
  const config = new PlotConfig(options);
  
  // Auto-detect data type and create appropriate visualization
  if (data.constructor.name === 'Vector') {
    return createHistogram(data, config);
  } else if (data.residuals && data.fitted_values) {
    // Linear model object
    return createResidualsPlot(data, config);
  } else if (data.constructor.name === 'DataFrame') {
    // TODO: Implement smart DataFrame visualization
    return createScatterPlot(data, config);
  }
  
  throw new Error('Unable to auto-detect visualization type for provided data');
}
