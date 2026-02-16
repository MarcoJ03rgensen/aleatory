/**
 * @module vis/plots/matrix
 * @description Matrix and correlation visualization functions
 */

/**
 * Create heatmap
 * @param {Array<Array>} matrix - 2D array of values
 * @param {PlotConfig} config - Plot configuration
 * @param {Object} options - Additional options
 * @returns {Object} Plotly figure specification
 */
export function createHeatmap(matrix, config, options = {}) {
  const trace = {
    z: matrix,
    x: options.xLabels || matrix[0].map((_, i) => `Col ${i + 1}`),
    y: options.yLabels || matrix.map((_, i) => `Row ${i + 1}`),
    type: 'heatmap',
    colorscale: options.colorscale || [
      [0, config.colors.primary],
      [0.5, '#FFFFFF'],
      [1, config.colors.secondary]
    ],
    showscale: true,
    colorbar: {
      title: { text: options.colorbarTitle || 'Value', font: config.fonts.axis },
      tickfont: config.fonts.tick
    }
  };
  
  // Add text annotations if requested
  if (options.showValues) {
    trace.text = matrix.map(row => row.map(val => val.toFixed(options.decimals || 2)));
    trace.texttemplate = '%{text}';
    trace.textfont = { size: config.fonts.tick.size };
  }
  
  const layout = config.toPlotlyLayout(
    options.title || 'Heatmap',
    { title: options.xlab || '' },
    { title: options.ylab || '' }
  );
  
  // Adjust layout for heatmap
  layout.xaxis.side = 'bottom';
  layout.yaxis.autorange = 'reversed';
  
  return { data: [trace], layout };
}

/**
 * Create correlation matrix heatmap
 * @param {Object} data - DataFrame or correlation matrix
 * @param {PlotConfig} config - Plot configuration
 * @param {Object} options - Additional options
 * @returns {Object} Plotly figure specification
 */
export function createCorrelationMatrix(data, config, options = {}) {
  let corrMatrix, labels;
  
  if (data.constructor?.name === 'DataFrame') {
    // Compute correlation matrix from DataFrame
    const numericCols = options.columns || 
      data.names.filter(name => {
        const col = data.col(name);
        return col.constructor?.name === 'Vector' || 
               (Array.isArray(col) && typeof col[0] === 'number');
      });
    
    labels = numericCols;
    const n = numericCols.length;
    corrMatrix = Array(n).fill().map(() => Array(n).fill(0));
    
    // Compute pairwise correlations
    for (let i = 0; i < n; i++) {
      const xi = data.colArray(numericCols[i]);
      const meanX = xi.reduce((a, b) => a + b) / xi.length;
      const sdX = Math.sqrt(xi.reduce((sum, x) => sum + (x - meanX) ** 2, 0) / (xi.length - 1));
      
      for (let j = 0; j < n; j++) {
        if (i === j) {
          corrMatrix[i][j] = 1;
        } else {
          const xj = data.colArray(numericCols[j]);
          const meanY = xj.reduce((a, b) => a + b) / xj.length;
          const sdY = Math.sqrt(xj.reduce((sum, x) => sum + (x - meanY) ** 2, 0) / (xj.length - 1));
          
          const cov = xi.reduce((sum, x, k) => sum + (x - meanX) * (xj[k] - meanY), 0) / (xi.length - 1);
          corrMatrix[i][j] = cov / (sdX * sdY);
        }
      }
    }
  } else {
    // Assume data is already a correlation matrix
    corrMatrix = data;
    labels = options.labels || corrMatrix.map((_, i) => `Var ${i + 1}`);
  }
  
  return createHeatmap(corrMatrix, config, {
    ...options,
    title: options.title || 'Correlation Matrix',
    xLabels: labels,
    yLabels: labels,
    colorscale: options.colorscale || [
      [0, '#0C5DA5'],
      [0.5, '#FFFFFF'],
      [1, '#FF2C00']
    ],
    colorbarTitle: 'Correlation',
    showValues: options.showValues !== false,
    decimals: 2
  });
}
