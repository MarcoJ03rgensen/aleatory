/**
 * @module vis/plots/categorical
 * @description Categorical data visualization functions
 */

/**
 * Create box plot
 * @param {Object} data - DataFrame or grouped data
 * @param {PlotConfig} config - Plot configuration
 * @param {Object} options - Additional options
 * @returns {Object} Plotly figure specification
 */
export function createBoxPlot(data, config, options = {}) {
  let traces = [];
  
  if (data.constructor?.name === 'DataFrame') {
    // Group by categorical variable if specified
    if (options.groupBy) {
      const grouped = data.groupBy(options.groupBy);
      const groups = grouped.groups;
      const valueCol = options.y || options.value;
      
      traces = Object.keys(groups).map((group, i) => {
        const groupData = groups[group];
        const values = groupData.colArray(valueCol);
        
        return {
          y: values,
          type: 'box',
          name: group,
          marker: {
            color: config.colors[['primary', 'secondary', 'tertiary', 'quaternary'][i % 4]]
          },
          boxmean: options.showMean ? 'sd' : false
        };
      });
    } else {
      // Single box plot
      const values = data.colArray(options.y || options.value);
      traces = [{
        y: values,
        type: 'box',
        name: options.name || 'Data',
        marker: { color: config.colors.primary },
        boxmean: options.showMean ? 'sd' : false
      }];
    }
  } else if (Array.isArray(data)) {
    // Array of arrays (pre-grouped data)
    traces = data.map((group, i) => ({
      y: group.values || group,
      type: 'box',
      name: group.name || `Group ${i + 1}`,
      marker: {
        color: config.colors[['primary', 'secondary', 'tertiary', 'quaternary'][i % 4]]
      },
      boxmean: options.showMean ? 'sd' : false
    }));
  }
  
  const layout = config.toPlotlyLayout(
    options.title || 'Box Plot',
    { title: options.xlab || '' },
    { title: options.ylab || 'Value' }
  );
  
  return { data: traces, layout };
}

/**
 * Create violin plot
 * @param {Object} data - DataFrame or grouped data
 * @param {PlotConfig} config - Plot configuration
 * @param {Object} options - Additional options
 * @returns {Object} Plotly figure specification
 */
export function createViolinPlot(data, config, options = {}) {
  let traces = [];
  
  if (data.constructor?.name === 'DataFrame') {
    if (options.groupBy) {
      const grouped = data.groupBy(options.groupBy);
      const groups = grouped.groups;
      const valueCol = options.y || options.value;
      
      traces = Object.keys(groups).map((group, i) => {
        const groupData = groups[group];
        const values = groupData.colArray(valueCol);
        
        return {
          y: values,
          type: 'violin',
          name: group,
          marker: {
            color: config.colors[['primary', 'secondary', 'tertiary', 'quaternary'][i % 4]]
          },
          box: { visible: options.showBox !== false },
          meanline: { visible: options.showMean === true }
        };
      });
    } else {
      const values = data.colArray(options.y || options.value);
      traces = [{
        y: values,
        type: 'violin',
        name: options.name || 'Data',
        marker: { color: config.colors.primary },
        box: { visible: options.showBox !== false },
        meanline: { visible: options.showMean === true }
      }];
    }
  } else if (Array.isArray(data)) {
    traces = data.map((group, i) => ({
      y: group.values || group,
      type: 'violin',
      name: group.name || `Group ${i + 1}`,
      marker: {
        color: config.colors[['primary', 'secondary', 'tertiary', 'quaternary'][i % 4]]
      },
      box: { visible: options.showBox !== false },
      meanline: { visible: options.showMean === true }
    }));
  }
  
  const layout = config.toPlotlyLayout(
    options.title || 'Violin Plot',
    { title: options.xlab || '' },
    { title: options.ylab || 'Value' }
  );
  
  return { data: traces, layout };
}

/**
 * Create bar plot
 * @param {Object} data - DataFrame or {x, y} object
 * @param {PlotConfig} config - Plot configuration
 * @param {Object} options - Additional options
 * @returns {Object} Plotly figure specification
 */
export function createBarPlot(data, config, options = {}) {
  let xValues, yValues;
  
  if (data.constructor?.name === 'DataFrame') {
    xValues = data.colArray(options.x);
    yValues = data.colArray(options.y);
  } else {
    xValues = data.x || [];
    yValues = data.y || [];
  }
  
  const trace = {
    x: xValues,
    y: yValues,
    type: 'bar',
    name: options.name || 'Data',
    marker: {
      color: config.colors.primary,
      opacity: config.opacity,
      line: { color: config.colors.text, width: 0.5 }
    }
  };
  
  const layout = config.toPlotlyLayout(
    options.title || 'Bar Plot',
    { title: options.xlab || '' },
    { title: options.ylab || 'Value' }
  );
  
  return { data: [trace], layout };
}
