/**
 * @module vis/plots/regression
 * @description Regression diagnostic and visualization plots
 */

/**
 * Create scatter plot with optional regression line
 * @param {Object} data - DataFrame or {x, y} object
 * @param {PlotConfig} config - Plot configuration
 * @param {Object} options - Additional options
 * @returns {Object} Plotly figure specification
 */
export function createScatterPlot(data, config, options = {}) {
  let xValues, yValues;
  
  if (data.constructor?.name === 'DataFrame') {
    xValues = data.colArray(options.x);
    yValues = data.colArray(options.y);
  } else {
    xValues = data.x || [];
    yValues = data.y || [];
  }
  
  const traces = [
    {
      x: xValues,
      y: yValues,
      type: 'scatter',
      mode: 'markers',
      name: 'Data',
      marker: {
        color: config.colors.primary,
        size: config.markerSize,
        opacity: config.opacity,
        line: { color: config.colors.text, width: 0.5 }
      }
    }
  ];
  
  // Add regression line if fit provided
  if (options.fit) {
    const fit = options.fit;
    const xSorted = [...xValues].sort((a, b) => a - b);
    const yFitted = xSorted.map(x => fit.coefficients[0] + fit.coefficients[1] * x);
    
    traces.push({
      x: xSorted,
      y: yFitted,
      type: 'scatter',
      mode: 'lines',
      name: 'Fitted line',
      line: {
        color: config.colors.secondary,
        width: config.lineWidth
      }
    });
    
    // Add confidence band if requested
    if (options.showConfidence && fit.se_fit) {
      const tValue = 1.96; // Approximate 95% CI
      const yUpper = yFitted.map((y, i) => y + tValue * fit.se_fit[i]);
      const yLower = yFitted.map((y, i) => y - tValue * fit.se_fit[i]);
      
      traces.push({
        x: [...xSorted, ...xSorted.reverse()],
        y: [...yUpper, ...yLower.reverse()],
        fill: 'toself',
        fillcolor: `rgba(${parseInt(config.colors.secondary.slice(1, 3), 16)}, ${parseInt(config.colors.secondary.slice(3, 5), 16)}, ${parseInt(config.colors.secondary.slice(5, 7), 16)}, 0.2)`,
        line: { color: 'transparent' },
        name: '95% CI',
        showlegend: true,
        hoverinfo: 'skip'
      });
    }
  }
  
  const layout = config.toPlotlyLayout(
    options.title || 'Scatter Plot',
    { title: options.xlab || 'X' },
    { title: options.ylab || 'Y' }
  );
  
  return { data: traces, layout };
}

/**
 * Create residuals vs fitted plot for regression diagnostics
 * @param {Object} fit - Model fit object (from lm or glm)
 * @param {PlotConfig} config - Plot configuration
 * @param {Object} options - Additional options
 * @returns {Object} Plotly figure specification
 */
export function createResidualsPlot(fit, config, options = {}) {
  const fitted = fit.fitted_values;
  const residuals = fit.residuals;
  
  const traces = [
    {
      x: fitted,
      y: residuals,
      type: 'scatter',
      mode: 'markers',
      name: 'Residuals',
      marker: {
        color: config.colors.primary,
        size: config.markerSize,
        opacity: config.opacity
      }
    },
    // Zero line
    {
      x: [Math.min(...fitted), Math.max(...fitted)],
      y: [0, 0],
      type: 'scatter',
      mode: 'lines',
      name: 'Zero line',
      line: {
        color: config.colors.secondary,
        width: config.lineWidth,
        dash: 'dash'
      }
    }
  ];
  
  // Add LOESS smoother if requested
  if (options.showSmooth) {
    // Simple moving average as smoother placeholder
    const windowSize = Math.floor(fitted.length * 0.1);
    const smoothed = [];
    const sortedIndices = fitted.map((_, i) => i).sort((a, b) => fitted[a] - fitted[b]);
    
    for (let i = 0; i < fitted.length; i++) {
      const idx = sortedIndices[i];
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(fitted.length, i + Math.ceil(windowSize / 2));
      const window = sortedIndices.slice(start, end);
      const avg = window.reduce((sum, j) => sum + residuals[j], 0) / window.length;
      smoothed[idx] = avg;
    }
    
    const xSorted = sortedIndices.map(i => fitted[i]);
    const ySorted = sortedIndices.map(i => smoothed[i]);
    
    traces.push({
      x: xSorted,
      y: ySorted,
      type: 'scatter',
      mode: 'lines',
      name: 'Smooth',
      line: {
        color: config.colors.tertiary,
        width: config.lineWidth
      }
    });
  }
  
  const layout = config.toPlotlyLayout(
    options.title || 'Residuals vs Fitted',
    { title: 'Fitted values' },
    { title: 'Residuals' }
  );
  
  return { data: traces, layout };
}

/**
 * Create fitted values plot (observed vs fitted)
 * @param {Object} fit - Model fit object
 * @param {PlotConfig} config - Plot configuration
 * @param {Object} options - Additional options
 * @returns {Object} Plotly figure specification
 */
export function createFittedPlot(fit, config, options = {}) {
  const observed = fit.y;
  const fitted = fit.fitted_values;
  
  const traces = [
    {
      x: fitted,
      y: observed,
      type: 'scatter',
      mode: 'markers',
      name: 'Data',
      marker: {
        color: config.colors.primary,
        size: config.markerSize,
        opacity: config.opacity
      }
    },
    // Perfect fit line
    {
      x: [Math.min(...fitted), Math.max(...fitted)],
      y: [Math.min(...fitted), Math.max(...fitted)],
      type: 'scatter',
      mode: 'lines',
      name: 'Perfect fit',
      line: {
        color: config.colors.secondary,
        width: config.lineWidth,
        dash: 'dash'
      }
    }
  ];
  
  const layout = config.toPlotlyLayout(
    options.title || 'Observed vs Fitted',
    { title: 'Fitted values' },
    { title: 'Observed values' }
  );
  
  return { data: traces, layout };
}

/**
 * Create leverage plot (Cook's distance and leverage)
 * @param {Object} diagnostics - Diagnostics object from diagnostics()
 * @param {PlotConfig} config - Plot configuration
 * @param {Object} options - Additional options
 * @returns {Object} Plotly figure specification
 */
export function createLeveragePlot(diagnostics, config, options = {}) {
  const leverage = diagnostics.leverage;
  const cooksD = diagnostics.cooks_d;
  const n = leverage.length;
  
  // Color points by Cook's distance
  const threshold = 4 / n; // Common threshold
  const colors = cooksD.map(d => d > threshold ? config.colors.quaternary : config.colors.primary);
  
  const trace = {
    x: leverage,
    y: cooksD,
    type: 'scatter',
    mode: 'markers',
    name: 'Observations',
    marker: {
      color: colors,
      size: config.markerSize,
      opacity: config.opacity,
      line: { color: config.colors.text, width: 0.5 }
    },
    text: leverage.map((_, i) => `Obs ${i + 1}<br>Leverage: ${leverage[i].toFixed(4)}<br>Cook's D: ${cooksD[i].toFixed(4)}`),
    hoverinfo: 'text'
  };
  
  const layout = config.toPlotlyLayout(
    options.title || "Cook's Distance vs Leverage",
    { title: 'Leverage' },
    { title: "Cook's Distance" }
  );
  
  // Add reference line for Cook's distance threshold
  layout.shapes = [{
    type: 'line',
    x0: 0,
    x1: Math.max(...leverage),
    y0: threshold,
    y1: threshold,
    line: {
      color: config.colors.secondary,
      width: 1,
      dash: 'dash'
    }
  }];
  
  return { data: [trace], layout };
}
