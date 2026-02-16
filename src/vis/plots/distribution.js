/**
 * @module vis/plots/distribution
 * @description Distribution visualization functions
 */

import { dnorm, qnorm } from '../../distributions/normal.js';
import { qt } from '../../distributions/t.js';

/**
 * Create histogram with optional density overlay
 * @param {Vector|Array} data - Data to plot
 * @param {PlotConfig} config - Plot configuration
 * @param {Object} options - Additional options (showDensity, showNormal, etc.)
 * @returns {Object} Plotly figure specification
 */
export function createHistogram(data, config, options = {}) {
  const values = Array.isArray(data) ? data : data.values.filter(x => !isNaN(x));
  
  const traces = [];
  
  // Histogram trace
  traces.push({
    x: values,
    type: 'histogram',
    nbinsx: options.bins || config.bins,
    name: 'Histogram',
    marker: {
      color: config.colors.primary,
      opacity: config.opacity,
      line: { color: config.colors.text, width: 0.5 }
    },
    histnorm: options.showDensity ? 'probability density' : ''
  });
  
  // Optional: Add normal density overlay
  if (options.showNormal) {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (values.length - 1);
    const sd = Math.sqrt(variance);
    
    const xRange = Math.max(...values) - Math.min(...values);
    const xMin = Math.min(...values) - 0.1 * xRange;
    const xMax = Math.max(...values) + 0.1 * xRange;
    const xSeq = Array.from({ length: 200 }, (_, i) => xMin + (i / 199) * (xMax - xMin));
    const ySeq = xSeq.map(x => dnorm(x, mean, sd));
    
    traces.push({
      x: xSeq,
      y: ySeq,
      type: 'scatter',
      mode: 'lines',
      name: 'Normal density',
      line: {
        color: config.colors.secondary,
        width: config.lineWidth
      }
    });
  }
  
  const layout = config.toPlotlyLayout(
    options.title || 'Histogram',
    { title: options.xlab || 'Value' },
    { title: options.ylab || (options.showDensity ? 'Density' : 'Frequency') }
  );
  
  return { data: traces, layout };
}

/**
 * Create kernel density estimate plot
 * @param {Vector|Array} data - Data to plot
 * @param {PlotConfig} config - Plot configuration
 * @param {Object} options - Additional options
 * @returns {Object} Plotly figure specification
 */
export function createDensityPlot(data, config, options = {}) {
  const values = Array.isArray(data) ? data : data.values.filter(x => !isNaN(x));
  
  // Simple KDE using Gaussian kernel
  const bandwidth = options.bandwidth || config.bandwidth;
  const h = bandwidth === 'auto' ? 
    1.06 * Math.sqrt(values.reduce((sum, x, _, arr) => {
      const mean = arr.reduce((a, b) => a + b) / arr.length;
      return sum + (x - mean) ** 2;
    }, 0) / (values.length - 1)) * Math.pow(values.length, -0.2) : 
    bandwidth;
  
  const xRange = Math.max(...values) - Math.min(...values);
  const xMin = Math.min(...values) - 0.5 * xRange;
  const xMax = Math.max(...values) + 0.5 * xRange;
  const xSeq = Array.from({ length: 200 }, (_, i) => xMin + (i / 199) * (xMax - xMin));
  
  const ySeq = xSeq.map(x => {
    return values.reduce((sum, xi) => {
      const u = (x - xi) / h;
      return sum + Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
    }, 0) / (values.length * h);
  });
  
  const trace = {
    x: xSeq,
    y: ySeq,
    type: 'scatter',
    mode: 'lines',
    name: 'Density',
    fill: options.fill ? 'tozeroy' : 'none',
    fillcolor: options.fill ? `rgba(${parseInt(config.colors.primary.slice(1, 3), 16)}, ${parseInt(config.colors.primary.slice(3, 5), 16)}, ${parseInt(config.colors.primary.slice(5, 7), 16)}, 0.3)` : undefined,
    line: {
      color: config.colors.primary,
      width: config.lineWidth
    }
  };
  
  const layout = config.toPlotlyLayout(
    options.title || 'Density Plot',
    { title: options.xlab || 'Value' },
    { title: options.ylab || 'Density' }
  );
  
  return { data: [trace], layout };
}

/**
 * Create Q-Q plot for assessing normality
 * @param {Vector|Array} data - Data to plot
 * @param {PlotConfig} config - Plot configuration
 * @param {Object} options - Additional options
 * @returns {Object} Plotly figure specification
 */
export function createQQPlot(data, config, options = {}) {
  const values = Array.isArray(data) ? data : data.values.filter(x => !isNaN(x));
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  // Theoretical quantiles
  const theoretical = sorted.map((_, i) => qnorm((i + 0.5) / n));
  
  // Sample quantiles (standardized)
  const mean = values.reduce((a, b) => a + b) / n;
  const sd = Math.sqrt(values.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (n - 1));
  const sample = sorted.map(x => (x - mean) / sd);
  
  const traces = [
    // Data points
    {
      x: theoretical,
      y: sample,
      type: 'scatter',
      mode: 'markers',
      name: 'Sample',
      marker: {
        color: config.colors.primary,
        size: config.markerSize,
        opacity: config.opacity
      }
    },
    // Reference line
    {
      x: [Math.min(...theoretical), Math.max(...theoretical)],
      y: [Math.min(...theoretical), Math.max(...theoretical)],
      type: 'scatter',
      mode: 'lines',
      name: 'Normal',
      line: {
        color: config.colors.secondary,
        width: config.lineWidth,
        dash: 'dash'
      }
    }
  ];
  
  const layout = config.toPlotlyLayout(
    options.title || 'Normal Q-Q Plot',
    { title: 'Theoretical Quantiles' },
    { title: 'Sample Quantiles' }
  );
  
  return { data: traces, layout };
}

/**
 * Create distribution function plot (PDF/CDF)
 * @param {Function} distFunc - Distribution function (dnorm, pnorm, etc.)
 * @param {PlotConfig} config - Plot configuration
 * @param {Object} options - Additional options (params, range, etc.)
 * @returns {Object} Plotly figure specification
 */
export function createDistributionPlot(distFunc, config, options = {}) {
  const xMin = options.xMin || -4;
  const xMax = options.xMax || 4;
  const xSeq = Array.from({ length: 200 }, (_, i) => xMin + (i / 199) * (xMax - xMin));
  const ySeq = xSeq.map(x => distFunc(x, ...(options.params || [])));
  
  const trace = {
    x: xSeq,
    y: ySeq,
    type: 'scatter',
    mode: 'lines',
    name: options.name || 'Distribution',
    line: {
      color: config.colors.primary,
      width: config.lineWidth
    }
  };
  
  const layout = config.toPlotlyLayout(
    options.title || 'Distribution Function',
    { title: options.xlab || 'x' },
    { title: options.ylab || 'Density' }
  );
  
  return { data: [trace], layout };
}
